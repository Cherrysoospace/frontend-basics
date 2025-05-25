export default class Instalacion {
  static #mode
  static #table
  static #form //atributo para asignar el codigo html del formulario
  static #option
  static #modal
  static #typeList
  static #types
  static #tipos // array de tipos de canchas de tenis
  static #currentOption // referencia la opción de adición o edición actual

  /**
   * locale: "es-419", // utilizar la configuración de idioma local
        langs: { es: es419 },
   */

  constructor() {
    throw new Error('No requiere instancias, todos los métodos son estáticos. Use Instalacion.init()')
  }

 static async init(mode = '', option = '') {
    console.clear()
    Instalacion.#mode = mode
    Instalacion.#option = option

    try {
      // intentar cargar el formulario de edición de instalaciones: piscinas|canchas de tenis|canchas múltiples
      Instalacion.#form = await Helpers.fetchText('./resources/html/instalacion.html')

      // hacer visible uno de los campos ocultos según el tipo de instalación deportiva
      Instalacion.#form = Instalacion.#form.replace(`data-mode="${mode}"`, 'class="col-6" style="display:block"')
      Instalacion.#option = option

      // cargar los datos de tipos de canchas para crear un select con ellos
      let response = await Helpers.fetchJSON(`${urlAPI}/canchas/tipos`)
      if (response.message != 'ok') {
        throw new Exception(response)
      }

      Instalacion.#tipos = response.data
      // crear las opciones para el select de tipos de canchas
      Instalacion.#typeList = Helpers.toOptionList({
        items: Instalacion.#tipos,
        value: 'key',
        text: 'value',
        firstOption: 'Seleccione un tipo de cancha',
      })

      // intentar cargar los datos de los instalaciones
      response = await Helpers.fetchJSON(`${urlAPI}/${mode}`)

      if (response.message !== 'ok') {
        throw new Error(response.message)
      }

      // agregar al <main> de index.html la capa que contendrá la tabla
      document.querySelector('main').innerHTML = `
        <div class="p-1 w-full">
            <div id="table-container" class="m-1"></div>
        </dv>`

      // ver en https://tabulator.info/docs/6.3/columns#definition cómo se definen las propiedades de las columnas
      // ver en https://tabulator.info/docs/6.3/format los diferentes valores de la propiedad formater de las columnas
      Instalacion.#table = new Tabulator('#table-container', {
        height: tableHeight, // establecer la altura de la tabla, esto habilita el DOM virtual y mejora drásticamente la velocidad de procesamiento
        data: response.data, // asignar los datos a la tabla
        layout: 'fitColumns', // ajustar columnas al ancho disponible
        history: true,
        columns: [
          // definir las columnas de la tabla
          { formatter: editRowButton, width: 40, hozAlign: 'center', cellClick: Instalacion.#editRowClick },
          { formatter: deleteRowButton, width: 40, hozAlign: 'center', cellClick: Instalacion.#deleteRowClick },
          { title: 'ID', field: 'id', width: 70, hozAlign: 'center' },
          { title: 'ANCHO', field: 'ancho', hozAlign: 'center', width: 95, formatter: 'money' }, // No se indica width, utilizar el ancho remanente
          { title: 'LARGO', field: 'largo', hozAlign: 'center', width: 95, formatter: 'money' },
          { title: 'ÁREA', field: 'area', hozAlign: 'right', width: 80, formatter: 'money' },
          { title: 'Vr. HORA', field: 'valorHora', hozAlign: 'center', width: 110, formatter: 'money' },
          Instalacion.#column(),
          { title: 'DESCRIPCION', field: 'descripcion', hozAlign: 'left' },
        ],
        responsiveLayout: false, // activado el scroll horizontal, también: ['hide'|true|false]
        initialSort: [
          // establecer el ordenamiento inicial de los datos
          { column: 'id', dir: 'asc' },
        ],
        columnDefaults: {
          tooltip: true, // mostrar información sobre la celda actual
        },
        pagination: 'local', // paginar la data
        paginationSize: 15, // permitir ## filas por páginas
        paginationCounter: 'rows', // mostrar el contador de filas paginadas en el pie página
        locale: "es-419",
        langs: { es: es419 }, // utilizar español, también puede servir { 'es': es419 }
        // mostrar al final de la tabla un botón para agregar registros
        footerElement: addRowButton,
      })

      // agregar un gestor de eventos al botón 'add-row' para mostrar el formulario en donde se ingresarán instalaciones
      Instalacion.#table.on('tableBuilt', () => document.querySelector('#add-row').addEventListener('click', Instalacion.#addRow))
    } catch (e) {
      Toast.show({ title: 'Ventas', message: e.message, mode: 'danger', error: e })
    }

    return this
  }

  static #column() {
    if (Instalacion.#mode == 'piscina') {
      return { title: 'OLÍMPICA', field: 'olimpica', width: 112, hozAlign: 'center', formatter: 'tickCross' }
    } else if (Instalacion.#mode == 'canchamultiproposito') {
      return { title: 'GRADERÍA', field: 'graderia', width: 112, hozAlign: 'center', formatter: 'tickCross' }
    } else if (Instalacion.#mode == 'canchatennis') {
      return { title: 'TIPO', field: 'tipoInstalacion', width: 174 }
    }
  }

     static async #addRow() {
    Instalacion.#currentOption = 'add'
    Instalacion.#modal = new Modal({
      classes: 'col-12 col-sm-10 col-md-9 col-lg-8 col-xl-7',
      title: `<h5>Ingreso de ${Instalacion.#option}</h5>`,
      content: Instalacion.#form,
      buttons: [
        { caption: addButton, classes: 'btn btn-primary me-2', action: () => Instalacion.#add() },
        { caption: cancelButton, classes: 'btn btn-secondary', action: () => Instalacion.#modal.remove() },
      ],
      doSomething: Instalacion.#displayDataOnForm, //se envía un callback
    })

    Instalacion.#modal.show()
    return true
  }

  static async #add() {
    try {
      // obtener del formulario el objeto con los datos que se envían a la solicitud POST
      const body = Instalacion.#getFormData()
      console.log(body)

      // verificar si los datos cumplen con las restricciones indicadas en el formulario HTML
      if (!Helpers.okForm('#form-instalacion')) {
        return
      }

      // enviar la solicitud de creación con los datos del formulario
      let response = await Helpers.fetchJSON(`${urlAPI}/${Instalacion.#mode}`, {
        method: 'POST',
        body,
      })

      if (response.message === 'ok') {
        Instalacion.#table.addRow(response.data) // agregar la instalación a la tabla respectiva
        Instalacion.#modal.remove()
        Toast.show({ message: 'Registro agregado exitosamente' })
      } else {
        Toast.show({ message: 'No se pudo agregar el registro', mode: 'danger', error: response })
      }
    } catch (e) {
      Toast.show({ message: 'Falló la creación del registro', mode: 'danger', error: e })
    }
  }

  static #editRowClick = async (e, cell) => {
    Instalacion.#currentOption = 'edit'

    Instalacion.#modal = new Modal({
      classes: 'col-12 col-sm-10 col-md-9 col-lg-8 col-xl-7',
      title: `<h5>Actualización de ${Instalacion.#option}</h5>`,
      content: Instalacion.#form,
      buttons: [
        { caption: editButton, classes: 'btn btn-primary me-2', action: () => Instalacion.#edit(cell) },
        { caption: cancelButton, classes: 'btn btn-secondary', action: () => Instalacion.#modal.remove() },
      ],
      doSomething: idModal => Instalacion.#displayDataOnForm(idModal, cell.getRow().getData()),
    })
    Instalacion.#modal.show()
  }

  static async #edit(cell) {
    try {
      // obtener del formulario el objeto con los datos que se envían a la solicitud PATCH
      const body = Instalacion.#getFormData()

      // verificar si los datos cumplen con las restricciones indicadas en el formulario HTML
      if (!Helpers.okForm('#form-instalacion')) {
        return
      }

      // configurar la url para enviar la solicitud PATCH
      const url = `${urlAPI}/${Instalacion.#mode}/${cell.getRow().getData().id}`

      // intentar enviar la solicitud de actualización
      let response = await Helpers.fetchJSON(url, {
        method: 'PATCH',
        body,
      })

      if (response.message === 'ok') {
        Toast.show({ message: 'Instalación actualizada exitosamente' })
        cell.getRow().update(response.data)
        Instalacion.#modal.remove()
      } else {
        Toast.show({ message: 'Actualización fallida', mode: 'danger', error: response })
      }
    } catch (e) {
      Toast.show({ message: 'Problemas al actualizar el registro', mode: 'danger', error: e })
    }
  }

  static #deleteRowClick = async (e, cell) => {
    Instalacion.#currentOption = 'delete'
    Instalacion.#modal = new Modal({
      classes: 'col-10 col-sm-8 col-md-6 col-lg-5 col-xl-4',
      title: `<h5>Eliminación de ${Instalacion.#option}</h5>`,
      content: `<span class="text-back dark:text-gray-300">
                  Confirme la eliminación de:<br>
                  ${cell.getRow().getData().id} – ${cell.getRow().getData().tipoInstalacion}<br>
                  ${cell.getRow().getData().descripcion}<br>
                </span>`,
      buttons: [
        { caption: deleteButton, classes: 'btn btn-primary me-2', action: () => Instalacion.#delete(cell) },
        { caption: cancelButton, classes: 'btn btn-secondary', action: () => Instalacion.#modal.remove() },
      ],
    })
    Instalacion.#modal.show()
  }

  static async #delete(cell) {
    try {
      const url = `${urlAPI}/${Instalacion.#mode}/${cell.getRow().getData().id}`

      // enviar la solicitud de eliminación
      let response = await Helpers.fetchJSON(url, {
        method: 'DELETE',
      })

      if (response.message === 'ok') {
        Toast.show({ message: 'Instalación eliminado exitosamente' })
        cell.getRow().delete()
        Instalacion.#modal.remove()
      } else {
        Toast.show({ message: response.message, mode: 'danger', error: response })
      }
    } catch (e) {
      Toast.show({ message: 'Problemas al eliminar la instalación', mode: 'danger', error: e })
    }
  }

  static #displayDataOnForm(idModal, rowData) {
    const selectTipos = document.querySelector(`#${idModal} #tipocancha`)
    if (Instalacion.#mode == 'canchatennis') {
      selectTipos.innerHTML = Instalacion.#typeList
    }

    if (Instalacion.#currentOption === 'edit') {
      // mostrar los datos de la fila actual en los input del formulario html
      document.querySelector(`#${idModal} #id`).value = rowData.id
      document.querySelector(`#${idModal} #descripcion`).value = rowData.descripcion
      document.querySelector(`#${idModal} #ancho`).value = rowData.ancho
      document.querySelector(`#${idModal} #largo`).value = rowData.largo

      if (Instalacion.#mode == 'canchatennis') {
        selectTipos.value = rowData.tipoCancha
      } else if (Instalacion.#mode == 'canchamultiproposito') {
        document.querySelector(`#${idModal} #graderias`).checked = rowData.graderia
      } else {
        document.querySelector(`#${idModal} #olimpica`).checked = rowData.olimpica
      }
    } else {
      //document.querySelector(`#${idModal} #id`).value = Helpers.idRandom(5, 'IS')
       document.querySelector(`#${idModal} #id`).value = Helpers.idRandom(5, 'SN')
    }
  }

 /**
 * Recupera los datos del formulario y crea un objeto para ser retornado
 * Incluye validaciones personalizadas para largo, ancho y descripción
 * @returns Un objeto con los datos de la instalación
 */
static #getFormData() {
  // Obtener referencias a los elementos del formulario
  const idElement = document.querySelector(`#${Instalacion.#modal.id} #id`)
  const descripcionElement = document.querySelector(`#${Instalacion.#modal.id} #descripcion`)
  const anchoElement = document.querySelector(`#${Instalacion.#modal.id} #ancho`)
  const largoElement = document.querySelector(`#${Instalacion.#modal.id} #largo`)

  // Obtener valores
  const descripcion = descripcionElement.value.trim()
  const ancho = Number(anchoElement.value)
  const largo = Number(largoElement.value)

  // *** VALIDACIONES PERSONALIZADAS ***

  // 1. Validación de DESCRIPCIÓN: requerido, entre 15 y 300 caracteres
  if (!descripcion) {
    descripcionElement.setCustomValidity('La descripción es requerida')
  } else if (descripcion.length < 15) {
    descripcionElement.setCustomValidity('La descripción debe tener al menos 15 caracteres')
  } else if (descripcion.length > 300) {
    descripcionElement.setCustomValidity('La descripción no puede exceder 300 caracteres')
  } else {
    descripcionElement.setCustomValidity('') // Válido
  }

  // 2. Validación de ANCHO: requerido, entre 1.2 y 90 metros
  if (!ancho || isNaN(ancho)) {
    anchoElement.setCustomValidity('El ancho es requerido y debe ser un número válido')
  } else if (ancho < 1.2) {
    anchoElement.setCustomValidity('El ancho debe ser al menos 1.2 metros')
  } else if (ancho > 90) {
    anchoElement.setCustomValidity('El ancho no puede exceder 90 metros')
  } else {
    anchoElement.setCustomValidity('') // Válido
  }

  // 3. Validación de LARGO: requerido, entre 1.2 y 90 metros
  if (!largo || isNaN(largo)) {
    largoElement.setCustomValidity('El largo es requerido y debe ser un número válido')
  } else if (largo < 1.2) {
    largoElement.setCustomValidity('El largo debe ser al menos 1.2 metros')
  } else if (largo > 90) {
    largoElement.setCustomValidity('El largo no puede exceder 90 metros')
  } else {
    largoElement.setCustomValidity('') // Válido
  }

  // Crear objeto con los datos básicos
  const data = {
    id: idElement.value,
    descripcion: descripcion,
    ancho: ancho,
    largo: largo,
  }

  // Validaciones específicas según el modo de instalación
  if (Instalacion.#mode == 'canchatennis') {
    const selectTipos = document.querySelector(`#${Instalacion.#modal.id} #tipocancha`)
    // Validación para el selector del tipo de cancha
    if (!selectTipos.value) {
      selectTipos.setCustomValidity('Por favor, seleccione un tipo de cancha')
    } else {
      selectTipos.setCustomValidity('') // Restablece la validez si la selección es válida
    }
    data.tipoCancha = selectTipos.value
  } else if (Instalacion.#mode == 'canchamultiproposito') {
    data.graderia = document.querySelector(`#${Instalacion.#modal.id} #graderias`).checked
  } else {
    data.olimpica = document.querySelector(`#${Instalacion.#modal.id} #olimpica`).checked
  }

  // *** INTERCAMBIO AUTOMÁTICO DE VALORES ***
  // Si ancho > largo, intercambiar valores (como estaba en el código original)
  if (data.ancho > data.largo) {
    const temp = data.ancho
    data.ancho = data.largo
    data.largo = temp
    
    // Actualizar los valores en el formulario para que el usuario vea el cambio
    anchoElement.value = data.ancho
    largoElement.value = data.largo
    
    // Opcional: mostrar un mensaje informativo al usuario
    Toast.show({ 
      message: 'Los valores de ancho y largo se intercambiaron automáticamente (ancho debe ser ≤ largo)', 
      mode: 'info' 
    })
  }

  return data
}
}


