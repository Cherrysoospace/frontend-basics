export default class Socio {
  static #table
  static #form // atributo para asignar el codigo html del formulario
  static #modal
  static #currentOption // referencia la opción de adición o edición actual

  constructor() {
    throw new Error('No requiere instancias, todos los métodos son estáticos. Use Socio.init()')
  }

  static async init() {
    console.clear()

    try {
      // intentar cargar el formulario de edición de socios
      Socio.#form = await Helpers.fetchText('./resources/html/socio.html')

      // intentar cargar los datos de los socios
      const response = await Helpers.fetchJSON(`${urlAPI}/socio`)

      if (response.message !== 'ok') {
        throw new Error(response.message)
      }

      // agregar al <main> de index.html la capa que contendrá la tabla
      document.querySelector('main').innerHTML = `
        <div class="p-1 w-full">
            <div id="table-container" class="m-1"></div>
        </div>`

      // ver en https://tabulator.info/docs/6.3/columns#definition cómo se definen las propiedades de las columnas
      // ver en https://tabulator.info/docs/6.3/format los diferentes valores de la propiedad formater de las columnas
      Socio.#table = new Tabulator('#table-container', {
        height: tableHeight, // establecer la altura de la tabla, esto habilita el DOM virtual y mejora drásticamente la velocidad de procesamiento
        data: response.data, // asignar los datos a la tabla
        layout: 'fitColumns', // ajustar columnas al ancho disponible
        columns: [
          // definir las columnas de la tabla
          { formatter: editRowButton, width: 40, hozAlign: 'center', cellClick: Socio.#editRowClick },
          { formatter: deleteRowButton, width: 40, hozAlign: 'center', cellClick: Socio.#deleteRowClick },
          { title: 'ID', field: 'id', width: 100, hozAlign: 'center' },
          { title: 'NOMBRE', field: 'nombre', width: 250 },
          { title: 'TELEFONO', field: 'telefono', hozAlign: 'left', width: 150 },
          { title: 'DIRECCION', field: 'direccion', hozAlign: 'left' }
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

      // agregar un gestor de eventos al botón 'add-row' para mostrar el formulario en donde se ingresarán socios
      Socio.#table.on('tableBuilt', () => document.querySelector('#add-row').addEventListener('click', Socio.#addRow))
    } catch (e) {
      Toast.show({ title: 'Socios', message: e.message, mode: 'danger', error: e })
    }

    return this
  }

  static #validateTelefono(telefono) {
  if (!telefono || telefono.trim() === '') {
    return { valid: false, message: 'El teléfono no puede estar vacío' }
  }
  
  const telefonoClean = telefono.trim()
  
  if (telefonoClean.length < 10 || telefonoClean.length > 100) {
    return { valid: false, message: 'El teléfono debe tener entre 10 y 100 caracteres' }
  }
  
  return { valid: true, message: '' }
}

  static async #addRow() {
    Socio.#currentOption = 'add'
    Socio.#modal = new Modal({
      classes: 'col-12 col-sm-10 col-md-9 col-lg-8 col-xl-7',
      title: `<h5>Ingreso de Socio</h5>`,
      content: Socio.#form,
      buttons: [
        { caption: addButton, classes: 'btn btn-primary me-2', action: () => Socio.#add() },
        { caption: cancelButton, classes: 'btn btn-secondary', action: () => Socio.#modal.remove() },
      ],
      doSomething: Socio.#displayDataOnForm,
    })

    Socio.#modal.show()
    return true
  }

  static async #add() {
  try {
    // obtener del formulario el objeto con los datos que se envían a la solicitud POST
    const body = Socio.#getFormData()
    
    // Si la validación personalizada falló, salir
    if (!body) {
      return
    }

    // verificar si los datos cumplen con las restricciones indicadas en el formulario HTML
    if (!Helpers.okForm('#form-socio')) {
      return
    }

    // enviar la solicitud de creación con los datos del formulario
    let response = await Helpers.fetchJSON(`${urlAPI}/socio`, {
      method: 'POST',
      body,
    })

    if (response.message === 'ok') {
      Socio.#table.addRow(response.data) // agregar el socio a la tabla respectiva
      Socio.#modal.remove()
      Toast.show({ message: 'Registro agregado exitosamente' })
    } else {
      Toast.show({ message: 'No se pudo agregar el registro', mode: 'danger', error: response })
    }
  } catch (e) {
    Toast.show({ message: 'Falló la creación del registro', mode: 'danger', error: e })
  }
}


  static #editRowClick = async (e, cell) => {
    Socio.#currentOption = 'edit'

    Socio.#modal = new Modal({
      classes: 'col-12 col-sm-10 col-md-9 col-lg-8 col-xl-7',
      title: `<h5>Actualización de Socio</h5>`,
      content: Socio.#form,
      buttons: [
        { caption: editButton, classes: 'btn btn-primary me-2', action: () => Socio.#edit(cell) },
        { caption: cancelButton, classes: 'btn btn-secondary', action: () => Socio.#modal.remove() },
      ],
      doSomething: idModal => Socio.#displayDataOnForm(idModal, cell.getRow().getData()),
    })
    Socio.#modal.show()
  }

  static async #edit(cell) {
  try {
    // obtener del formulario el objeto con los datos que se envían a la solicitud PATCH
    const body = Socio.#getFormData()
    
    // Si la validación personalizada falló, salir
    if (!body) {
      return
    }

    // verificar si los datos cumplen con las restricciones indicadas en el formulario HTML
    if (!Helpers.okForm('#form-socio')) {
      return
    }

    // configurar la url para enviar la solicitud PATCH
    const url = `${urlAPI}/socio/${cell.getRow().getData().id}`

    // intentar enviar la solicitud de actualización
    let response = await Helpers.fetchJSON(url, {
      method: 'PATCH',
      body,
    })

    if (response.message === 'ok') {
      Toast.show({ message: 'Socio actualizado exitosamente' })
      cell.getRow().update(response.data)
      Socio.#modal.remove()
    } else {
      Toast.show({ message: 'Actualización fallida', mode: 'danger', error: response })
    }
  } catch (e) {
    Toast.show({ message: 'Problemas al actualizar el registro', mode: 'danger', error: e })
  }
}

  static #deleteRowClick = async (e, cell) => {
    Socio.#currentOption = 'delete'
    Socio.#modal = new Modal({
      classes: 'col-10 col-sm-8 col-md-6 col-lg-5 col-xl-4',
      title: `<h5>Eliminación de Socio</h5>`,
      content: `<span class="text-back dark:text-gray-300">
                  Confirme la eliminación de:<br>
                  ${cell.getRow().getData().id} – ${cell.getRow().getData().nombre}<br>
                  ${cell.getRow().getData().telefono}<br>
                  ${cell.getRow().getData().direccion}<br>
                </span>`,
      buttons: [
        { caption: deleteButton, classes: 'btn btn-primary me-2', action: () => Socio.#delete(cell) },
        { caption: cancelButton, classes: 'btn btn-secondary', action: () => Socio.#modal.remove() },
      ],
    })
    Socio.#modal.show()
  }

  static async #delete(cell) {
    try {
      const url = `${urlAPI}/socio/${cell.getRow().getData().id}`

      // enviar la solicitud de eliminación
      let response = await Helpers.fetchJSON(url, {
        method: 'DELETE',
      })

      if (response.message === 'ok') {
        Toast.show({ message: 'Socio eliminado exitosamente' })
        cell.getRow().delete()
        Socio.#modal.remove()
      } else {
        Toast.show({ message: response.message, mode: 'danger', error: response })
      }
    } catch (e) {
      Toast.show({ message: 'Problemas al eliminar el socio', mode: 'danger', error: e })
    }
  }

  static #displayDataOnForm(idModal, rowData) {
    if (Socio.#currentOption === 'edit') {
      // mostrar los datos de la fila actual en los input del formulario html
      document.querySelector(`#${idModal} #id`).value = rowData.id
      document.querySelector(`#${idModal} #nombre`).value = rowData.nombre
      document.querySelector(`#${idModal} #telefono`).value = rowData.telefono
      document.querySelector(`#${idModal} #direccion`).value = rowData.direccion
    } else {
      // para nuevos registros, generar un ID aleatorio
      document.querySelector(`#${idModal} #id`).value = Helpers.idRandom(5, 'SO')
    }
  }

  static #validateId(id) {
  if (!id || id.trim() === '') {
    return { valid: false, message: 'La identificación no puede estar vacía' }
  }
  
  const idClean = id.trim()
  // Permitir IDs de 5 caracteres o más (considerando el prefijo SO + 3 dígitos)
  if (idClean.length < 5) {
    return { valid: false, message: 'La identificación debe tener al menos 5 caracteres' }
  }
  
  return { valid: true, message: '' }
}

// Método de validación para Nombre
static #validateNombre(nombre) {
  if (!nombre || nombre.trim() === '') {
    return { valid: false, message: 'El nombre no puede estar en blanco' }
  }
  
  const nombreClean = nombre.trim()
  if (nombreClean.length < 1 || nombreClean.length > 50) {
    return { valid: false, message: 'El nombre debe tener entre 1 y 50 caracteres' }
  }
  
  return { valid: true, message: '' }
}

// Método de validación para Dirección
static #validateDireccion(direccion) {
  if (!direccion || direccion.trim() === '') {
    return { valid: false, message: 'La dirección no puede estar en blanco' }
  }
  
  const direccionClean = direccion.trim()
  if (direccionClean.length < 10 || direccionClean.length > 200) {
    return { valid: false, message: 'La dirección debe tener entre 10 y 200 caracteres' }
  }
  
  return { valid: true, message: '' }
}

// Método auxiliar para mostrar errores de validación
static #showValidationError(fieldName, message) {
  Toast.show({ 
    message: message, 
    mode: 'danger' 
  })
  
  // Enfocar el campo y marcarlo como inválido
  const fieldInput = document.querySelector(`#${Socio.#modal.id} #${fieldName}`)
  fieldInput.focus()
  fieldInput.classList.add('is-invalid')
  
  // Quitar la clase de error después de que el usuario empiece a escribir
  fieldInput.addEventListener('input', function() {
    this.classList.remove('is-invalid')
  }, { once: true })
}

  /**
   * Recupera los datos del formulario y crea un objeto para ser retornado
   * @returns Un objeto con los datos del socio
   */
  static #getFormData() {
  // Obtener valores del formulario
  const id = document.querySelector(`#${Socio.#modal.id} #id`).value.trim()
  const nombre = document.querySelector(`#${Socio.#modal.id} #nombre`).value.trim()
  const telefono = document.querySelector(`#${Socio.#modal.id} #telefono`).value.trim()
  const direccion = document.querySelector(`#${Socio.#modal.id} #direccion`).value.trim()
  
  // Validar ID/Identificación
  const idValidation = Socio.#validateId(id)
  if (!idValidation.valid) {
    Socio.#showValidationError('id', idValidation.message)
    return null
  }

  // Validar Nombre
  const nombreValidation = Socio.#validateNombre(nombre)
  if (!nombreValidation.valid) {
    Socio.#showValidationError('nombre', nombreValidation.message)
    return null
  }

  // Validar Teléfono (tu validación existente)
  const telefonoValidation = Socio.#validateTelefono(telefono)
  if (!telefonoValidation.valid) {
    Socio.#showValidationError('telefono', telefonoValidation.message)
    return null
  }

  // Validar Dirección
  const direccionValidation = Socio.#validateDireccion(direccion)
  if (!direccionValidation.valid) {
    Socio.#showValidationError('direccion', direccionValidation.message)
    return null
  }

  // Si todas las validaciones pasaron, crear y retornar el objeto
  const data = {
    id: id,
    nombre: nombre,
    telefono: telefono,
    direccion: direccion,
  }

  return data
}
}