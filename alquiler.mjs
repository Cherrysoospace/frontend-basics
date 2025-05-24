export default class Alquiler {
  static #table
  static #form // atributo para asignar el codigo html del formulario
  static #modal
  static #currentOption // referencia la opción de adición o edición actual
  static #socios // array de socios para el select
  static #instalaciones // array de instalaciones para el select
  static #sociosList // opciones HTML para el select de socios
  static #instalacionesList // opciones HTML para el select de instalaciones

  constructor() {
    throw new Error('No requiere instancias, todos los métodos son estáticos. Use Alquiler.init()')
  }

 static async init() {
  console.clear()

  try {
    // intentar cargar el formulario de edición de alquileres
    Alquiler.#form = await Helpers.fetchText('./resources/html/alquiler.html')

    // cargar los datos de socios para crear un select con ellos
    let responseSocios = await Helpers.fetchJSON(`${urlAPI}/socio`)
    if (responseSocios.message != 'ok') {
      throw new Error(responseSocios.message)
    }

    Alquiler.#socios = responseSocios.data
    // crear las opciones para el select de socios
    Alquiler.#sociosList = Helpers.toOptionList({
      items: Alquiler.#socios,
      value: 'id',
      text: 'nombre',
      firstOption: 'Seleccione un socio',
    })

    // cargar TODAS las instalaciones deportivas usando el método loadAll
    // Esto incluye piscinas, canchas de tenis y canchas multipropósito
    let responseInstalaciones = await Helpers.fetchJSON(`${urlAPI}/canchas/todas`)
if (responseInstalaciones.message != 'ok') {
  throw new Error(responseInstalaciones.message)
}

Alquiler.#instalaciones = responseInstalaciones.data

// MODIFICACIÓN: Agregar el atributo concatenado a cada instalación
Alquiler.#instalaciones.forEach(item => {
  item.displayText = `${item.id} - ${item.tipoInstalacion}`
})

// crear las opciones para el select de instalaciones usando el nuevo atributo
Alquiler.#instalacionesList = Helpers.toOptionList({
  items: Alquiler.#instalaciones,
  value: 'id',
  text: 'displayText',  // CAMBIO: usar displayText en lugar de descripcion
  firstOption: 'Seleccione una instalación',
})

    // intentar cargar los datos de los alquileres
    const response = await Helpers.fetchJSON(`${urlAPI}/alquiler`)

    if (response.message !== 'ok') {
      throw new Error(response.message)
    }

    // agregar al <main> de index.html la capa que contendrá la tabla
    document.querySelector('main').innerHTML = `
      <div class="p-1 w-full">
          <div id="table-container" class="m-1"></div>
      </div>`

    // resto del código de configuración de la tabla...
    Alquiler.#table = new Tabulator('#table-container', {
      height: tableHeight,
      locale: 'es-419',
      langs: {'es': es419 },
      data: response.data,
      layout: "fitColumns",
      columns: [
        { formatter: editRowButton, hozAlign: 'center', width: 40, cellClick: Alquiler.#editRowClick },
        { formatter: deleteRowButton, hozAlign: 'center', width: 40, cellClick: Alquiler.#deleteRowClick },
        { title: 'ID', field: 'id', hozAlign: 'center', width: 95 },
        { 
          title: 'INICIO', 
          field: 'fechaHoraInicio', 
          hozAlign: 'center', 
          width: 140,
          formatter: (cell) => {
            const value = cell.getValue()
            try {
              return DateTime.fromISO(value).toFormat(window.formatDateTime.outputFormat)
            } catch {
              return window.formatDateTime.invalidPlaceholder
            }
          }
        },
        { 
          title: 'FIN', 
          field: 'fechaHoraFin', 
          hozAlign: 'center', 
          width: 140,
          formatter: (cell) => {
            const value = cell.getValue()
            try {
              return DateTime.fromISO(value).toFormat(window.formatDateTime.outputFormat)
            } catch {
              return window.formatDateTime.invalidPlaceholder
            }
          }
        },
        { title: 'HORAS', field: 'horas', hozAlign: 'center', width: 80, formatter: 'money', formatterParams: { precision: 0 } },
        { title: 'Vr. HORA', field: 'instalacionDeportiva.valorHora', hozAlign: 'center', width: 95, formatter: 'money' },
        { title: 'Vr. TOTAL', field: 'valorAlquiler', hozAlign: 'center', width: 95, formatter: 'money' },
        { 
          title: 'SOCIO', 
          field: 'socio.id', 
          hozAlign: 'center', 
          width: 95,   
          clickPopup: (e, component) => {
            const data = component.getData().socio
            return `
              <div>
                <strong>ID:</strong> ${data.id}<br>
                <strong>Nombre:</strong> ${data.nombre}<br>
                <strong>Teléfono:</strong> ${data.telefono || 'N/A'}<br>
                <strong>Direccion:</strong> ${data.direccion || 'N/A'}
              </div>
            `
          }
        },
       { 
  title: 'INSTALACION',  
  field: 'instalacionDeportiva.id',  // CAMBIO: Mostrar ID en lugar de tipoInstalacion
  hozAlign: 'center',                // CAMBIO: Centrar el ID
  width: 120,                        // CAMBIO: Ajustar el ancho
  clickPopup: (e, component) => {
    const data = component.getData().instalacionDeportiva
    return `
      <div>
        <strong>ID:</strong> ${data.id}<br>
        <strong>Tipo:</strong> ${data.tipoInstalacion}<br>
        <strong>Ancho:</strong> ${data.ancho} m<br>
        <strong>Largo:</strong> ${data.largo} m<br>
        <strong>Área:</strong> ${data.area} m²<br>
        <strong>Descripción:</strong> ${data.descripcion}
      </div>
    `
  }
}
      ],
      responsiveLayout: false,
      addRowPos: "top",
      history: true,
      pagination: "local",
      paginationSize: 15,
      paginationCounter: "rows",
      movableColumns: true,
      initialSort: [{ column: 'id', dir: "asc" }],
      columnDefaults: { tooltip: true },
      footerElement: addRowButton
    })

    // agregar un gestor de eventos al botón 'add-row'
    Alquiler.#table.on('tableBuilt', () => document.querySelector('#add-row').addEventListener('click', Alquiler.#addRow))
  } catch (e) {
    Toast.show({ title: 'Alquiler', message: e.message, mode: 'danger', error: e })
  }

  return this
}
  static async #addRow() {
    Alquiler.#currentOption = 'add'
    Alquiler.#modal = new Modal({
      classes: 'col-12 col-sm-10 col-md-9 col-lg-8 col-xl-7',
      title: `<h5>Ingreso de Alquiler</h5>`,
      content: Alquiler.#form,
      buttons: [
        { caption: addButton, classes: 'btn btn-primary me-2', action: () => Alquiler.#add() },
        { caption: cancelButton, classes: 'btn btn-secondary', action: () => Alquiler.#modal.remove() },
      ],
      doSomething: Alquiler.#displayDataOnForm,
    })

    Alquiler.#modal.show()
    return true
  }

  static async #add() {
    try {
      // obtener del formulario el objeto con los datos que se envían a la solicitud POST
      const body = Alquiler.#getFormData()

      // verificar si los datos cumplen con las restricciones indicadas en el formulario HTML
      if (!Helpers.okForm('#form-alquiler')) {
        return
      }

      // enviar la solicitud de creación con los datos del formulario
      let response = await Helpers.fetchJSON(`${urlAPI}/alquiler`, {
        method: 'POST',
        body,
      })

      if (response.message === 'ok') {
        Alquiler.#table.addRow(response.data) // agregar el alquiler a la tabla respectiva
        Alquiler.#modal.remove()
        Toast.show({ message: 'Registro agregado exitosamente' })
      } else {
        Toast.show({ message: 'No se pudo agregar el registro', mode: 'danger', error: response })
      }
    } catch (e) {
      Toast.show({ message: 'Falló la creación del registro', mode: 'danger', error: e })
    }
  }

  static #editRowClick = async (e, cell) => {
    Alquiler.#currentOption = 'edit'

    Alquiler.#modal = new Modal({
      classes: 'col-12 col-sm-10 col-md-9 col-lg-8 col-xl-7',
      title: `<h5>Actualización de Alquiler</h5>`,
      content: Alquiler.#form,
      buttons: [
        { caption: editButton, classes: 'btn btn-primary me-2', action: () => Alquiler.#edit(cell) },
        { caption: cancelButton, classes: 'btn btn-secondary', action: () => Alquiler.#modal.remove() },
      ],
      doSomething: idModal => Alquiler.#displayDataOnForm(idModal, cell.getRow().getData()),
    })
    Alquiler.#modal.show()
  }

  static async #edit(cell) {
    try {
      // obtener del formulario el objeto con los datos que se envían a la solicitud PATCH
      const body = Alquiler.#getFormData()

      // verificar si los datos cumplen con las restricciones indicadas en el formulario HTML
      if (!Helpers.okForm('#form-alquiler')) {
        return
      }

      // configurar la url para enviar la solicitud PATCH
      const url = `${urlAPI}/alquiler/${cell.getRow().getData().id}`

      // intentar enviar la solicitud de actualización
      let response = await Helpers.fetchJSON(url, {
        method: 'PATCH',
        body,
      })

      if (response.message === 'ok') {
        Toast.show({ message: 'Alquiler actualizado exitosamente' })
        cell.getRow().update(response.data)
        Alquiler.#modal.remove()
      } else {
        Toast.show({ message: 'Actualización fallida', mode: 'danger', error: response })
      }
    } catch (e) {
      Toast.show({ message: 'Problemas al actualizar el registro', mode: 'danger', error: e })
    }
  }

 static #deleteRowClick = async (e, cell) => {
  Alquiler.#currentOption = 'delete'
  const rowData = cell.getRow().getData()
     
  // Formatear las fechas con Luxon en español
  const fechaInicio = DateTime.fromISO(rowData.fechaHoraInicio).setLocale('es')
  const fechaFin = DateTime.fromISO(rowData.fechaHoraFin).setLocale('es')
     
  // Formato personalizado: "lunes, 15 de enero de 2024, 14:30"
  const formatoCompleto = "cccc, dd 'de' LLLL 'de' yyyy, HH:mm"
     
  const fechaInicioFormateada = fechaInicio.toFormat(formatoCompleto)
  const fechaFinFormateada = fechaFin.toFormat(formatoCompleto)
     
  Alquiler.#modal = new Modal({
    classes: 'col-10 col-sm-8 col-md-6 col-lg-5 col-xl-4',
    title: `<h5>Confirme la eliminación del alquiler ${rowData.id}</h5>`,
    content: `
      <div style="color: black;">
        <div class="mb-3">
          <strong>Instalación:</strong> <span class="text-primary">${rowData.instalacionDeportiva.id}</span> - ${rowData.instalacionDeportiva.descripcion}
        </div>
                 
        <div class="mb-3">
          <strong>Fecha y hora de inicio:</strong> <span class="text-info">${fechaInicioFormateada}</span>
        </div>
                 
        <div class="mb-3">
          <strong>Fecha y hora de fin:</strong> <span class="text-info">${fechaFinFormateada}</span>
        </div>
                 
        <div class="mb-2">
          <strong>Alquilado por:</strong> <span class="text-success">${rowData.socio.id}</span> - ${rowData.socio.nombre}
        </div>
                 
        <hr>
        <div class="text-center">
          <small class="text-muted">Esta acción no se puede deshacer</small>
        </div>
      </div>
    `,
    buttons: [
      { caption: deleteButton, classes: 'btn btn-danger me-2', action: () => Alquiler.#delete(cell) },
      { caption: cancelButton, classes: 'btn btn-secondary', action: () => Alquiler.#modal.remove() },
    ],
  })
  Alquiler.#modal.show()
}

  static async #delete(cell) {
    try {
      const url = `${urlAPI}/alquiler/${cell.getRow().getData().id}`

      // enviar la solicitud de eliminación
      let response = await Helpers.fetchJSON(url, {
        method: 'DELETE',
      })

      if (response.message === 'ok') {
        Toast.show({ message: 'Alquiler eliminado exitosamente' })
        cell.getRow().delete()
        Alquiler.#modal.remove()
      } else {
        Toast.show({ message: response.message, mode: 'danger', error: response })
      }
    } catch (e) {
      Toast.show({ message: 'Problemas al eliminar el alquiler', mode: 'danger', error: e })
    }
  }

  static #displayDataOnForm(idModal, rowData) {
  // llenar los selects con las opciones
  const selectSocios = document.querySelector(`#${idModal} #socio`)
  const selectInstalaciones = document.querySelector(`#${idModal} #instalacion`)
  
  selectSocios.innerHTML = Alquiler.#sociosList
  selectInstalaciones.innerHTML = Alquiler.#instalacionesList

  if (Alquiler.#currentOption === 'edit') {
    // mostrar los datos de la fila actual en los input del formulario html
    document.querySelector(`#${idModal} #id`).value = rowData.id
    document.querySelector(`#${idModal} #fechaHoraInicio`).value = DateTime.fromISO(rowData.fechaHoraInicio).toFormat('yyyy-MM-dd\'T\'HH:mm')
    document.querySelector(`#${idModal} #fechaHoraFin`).value = DateTime.fromISO(rowData.fechaHoraFin).toFormat('yyyy-MM-dd\'T\'HH:mm')
    selectSocios.value = rowData.socio.id
    selectInstalaciones.value = rowData.instalacionDeportiva.id
    
    // Llenar también los campos calculados
    document.querySelector(`#${idModal} #horas`).value = rowData.horas
    document.querySelector(`#${idModal} #valorHora`).value = rowData.instalacionDeportiva.valorHora
    document.querySelector(`#${idModal} #valorAlquiler`).value = rowData.valorAlquiler
  } else {
    // para nuevos registros, generar un ID aleatorio
    document.querySelector(`#${idModal} #id`).value = Helpers.idRandom(5, 'AL')
    
    // establecer fecha y hora actual como valores por defecto
    const now = DateTime.now()
    document.querySelector(`#${idModal} #fechaHoraInicio`).value = now.toFormat('yyyy-MM-dd\'T\'HH:mm')
    document.querySelector(`#${idModal} #fechaHoraFin`).value = now.plus({ hours: 1 }).toFormat('yyyy-MM-dd\'T\'HH:mm')
    
    // Limpiar campos calculados
    document.querySelector(`#${idModal} #horas`).value = ''
    document.querySelector(`#${idModal} #valorHora`).value = ''
    document.querySelector(`#${idModal} #valorAlquiler`).value = ''
  }

  // agregar eventos para calcular automáticamente las horas y valor total
  const fechaInicio = document.querySelector(`#${idModal} #fechaHoraInicio`)
  const fechaFin = document.querySelector(`#${idModal} #fechaHoraFin`)
  const instalacionSelect = document.querySelector(`#${idModal} #instalacion`)

  const calcularValor = () => {
    const inicio = DateTime.fromISO(fechaInicio.value)
    const fin = DateTime.fromISO(fechaFin.value)
    const instalacionId = instalacionSelect.value
    
    if (inicio.isValid && fin.isValid && instalacionId) {
      const horas = fin.diff(inicio, 'hours').hours
      // Buscar la instalación por ID (no por descripción)
      const instalacion = Alquiler.#instalaciones.find(i => i.id === instalacionId)
      
      if (instalacion && horas > 0) {
        const valorTotal = horas * instalacion.valorHora
        document.querySelector(`#${idModal} #horas`).value = horas.toFixed(1)
        document.querySelector(`#${idModal} #valorHora`).value = instalacion.valorHora
        document.querySelector(`#${idModal} #valorAlquiler`).value = valorTotal.toFixed(2)
      }
    } else {
      // Si no hay datos válidos, limpiar los campos calculados
      if (!instalacionId) {
        document.querySelector(`#${idModal} #valorHora`).value = ''
      }
      if (!inicio.isValid || !fin.isValid || !instalacionId) {
        document.querySelector(`#${idModal} #horas`).value = ''
        document.querySelector(`#${idModal} #valorAlquiler`).value = ''
      }
    }
  }

  // También calcular cuando solo cambie la instalación (para mostrar el valor por hora)
  const mostrarValorHora = () => {
    const instalacionId = instalacionSelect.value
    if (instalacionId) {
      const instalacion = Alquiler.#instalaciones.find(i => i.id === instalacionId)
      if (instalacion) {
        document.querySelector(`#${idModal} #valorHora`).value = instalacion.valorHora
        // Recalcular todo si ya hay fechas válidas
        calcularValor()
      }
    } else {
      document.querySelector(`#${idModal} #valorHora`).value = ''
      document.querySelector(`#${idModal} #horas`).value = ''
      document.querySelector(`#${idModal} #valorAlquiler`).value = ''
    }
  }

  fechaInicio.addEventListener('change', calcularValor)
  fechaFin.addEventListener('change', calcularValor)
  instalacionSelect.addEventListener('change', mostrarValorHora)
  
  // Calcular valores iniciales si estamos editando
  if (Alquiler.#currentOption === 'edit') {
    calcularValor()
  }
}

  /**
   * Recupera los datos del formulario y crea un objeto para ser retornado
   * @returns Un objeto con los datos del alquiler
   */
  static #getFormData() {
  const selectSocios = document.querySelector(`#${Alquiler.#modal.id} #socio`)
  const selectInstalaciones = document.querySelector(`#${Alquiler.#modal.id} #instalacion`)
  
  // agregar validadores personalizados para los selectores
  if (!selectSocios.value) {
    selectSocios.setCustomValidity('Por favor, seleccione un socio')
  } else {
    selectSocios.setCustomValidity('')
  }
  
  if (!selectInstalaciones.value) {
    selectInstalaciones.setCustomValidity('Por favor, seleccione una instalación')
  } else {
    selectInstalaciones.setCustomValidity('')
  }

  // Buscar los objetos completos basados en los IDs seleccionados
  const socioSeleccionado = Alquiler.#socios.find(s => s.id === selectSocios.value)
  const instalacionSeleccionada = Alquiler.#instalaciones.find(i => i.id === selectInstalaciones.value)

  // Obtener las fechas originales
  let fechaInicio = document.querySelector(`#${Alquiler.#modal.id} #fechaHoraInicio`).value
  let fechaFin = document.querySelector(`#${Alquiler.#modal.id} #fechaHoraFin`).value

  // Validar y intercambiar fechas si es necesario
  if (fechaInicio && fechaFin) {
    const dateInicio = new Date(fechaInicio)
    const dateFin = new Date(fechaFin)
    
    // Si la fecha fin es anterior a la fecha inicio, intercambiarlas
    if (dateFin < dateInicio) {
      const temp = fechaInicio
      fechaInicio = fechaFin
      fechaFin = temp
      
      // Opcional: Actualizar los campos en el DOM para mostrar el cambio
      document.querySelector(`#${Alquiler.#modal.id} #fechaHoraInicio`).value = fechaInicio
      document.querySelector(`#${Alquiler.#modal.id} #fechaHoraFin`).value = fechaFin
      
      console.log('Fechas intercambiadas: inicio era posterior a fin')
    }
  }

  const data = {
    id: document.querySelector(`#${Alquiler.#modal.id} #id`).value,
    fechaHoraInicio: fechaInicio,
    fechaHoraFin: fechaFin,
    horas: parseFloat(document.querySelector(`#${Alquiler.#modal.id} #horas`).value),
    valorAlquiler: parseFloat(document.querySelector(`#${Alquiler.#modal.id} #valorAlquiler`).value),
    socio: socioSeleccionado,                    // Enviar el objeto socio completo
    instalacionDeportiva: instalacionSeleccionada  // Enviar el objeto instalación completo
  }
  
  // Opcional: Para debugging - eliminar después
  console.log('Datos a enviar:', data)

  return data
}
}