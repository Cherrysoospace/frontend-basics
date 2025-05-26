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
                <h4><strong></strong> ${data.nombre}</h4>
                <hr>
                <strong>ID:</strong> ${data.id}<br>
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
        <h4><strong></strong> ${data.tipoInstalacion}</h4>
        <hr>
        <strong>ID:</strong> ${data.id}<br>
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

  // NUEVA FUNCIÓN: Validar horarios de las fechas
  static #validarHorarios(fechaInicio, fechaFin) {
    const horaInicio = parseInt(fechaInicio.split('T')[1].split(':')[0])
    const horaFin = parseInt(fechaFin.split('T')[1].split(':')[0])
    
    const errors = []
    
    // Validar hora de inicio (7 AM - 9 PM = 7-21)
    if (horaInicio < 7 || horaInicio > 21) {
      errors.push('La hora de inicio debe estar entre las 7:00 AM y las 9:00 PM')
    }
    
    // Validar hora de fin (8 AM - 10 PM = 8-22)
    if (horaFin < 8 || horaFin > 22) {
      errors.push('La hora de finalización debe estar entre las 8:00 AM y las 10:00 PM')
    }
    
    return errors
  }

  // NUEVA FUNCIÓN: Validar que las fechas sean del mismo día
  static #validarMismoDia(fechaInicio, fechaFin) {
    const fechaInicioObj = DateTime.fromISO(fechaInicio)
    const fechaFinObj = DateTime.fromISO(fechaFin)
    
    // Comparar solo la fecha (año, mes, día) ignorando la hora
    const fechaInicioSolo = fechaInicioObj.toISODate() // formato YYYY-MM-DD
    const fechaFinSolo = fechaFinObj.toISODate()       // formato YYYY-MM-DD
    
    return fechaInicioSolo === fechaFinSolo
  }

  // NUEVA FUNCIÓN: Validar todas las restricciones de fechas
  static #validarFechas(fechaInicio, fechaFin) {
    const errors = []
    
    // Validar que las fechas sean válidas
    const fechaInicioObj = DateTime.fromISO(fechaInicio)
    const fechaFinObj = DateTime.fromISO(fechaFin)
    
    if (!fechaInicioObj.isValid || !fechaFinObj.isValid) {
      errors.push('Las fechas ingresadas no son válidas')
      return errors
    }
    
    // Validar que la fecha de fin no sea anterior a la de inicio
    if (fechaFinObj < fechaInicioObj) {
      errors.push('La fecha y hora de finalización no puede ser anterior a la de inicio')
    }
    
    // Validar que las fechas sean del mismo día
    if (!Alquiler.#validarMismoDia(fechaInicio, fechaFin)) {
      errors.push('El alquiler debe realizarse dentro del mismo día. La fecha de inicio y fin deben ser el mismo día.')
    }
    
    // Validar horarios permitidos
    const erroresHorario = Alquiler.#validarHorarios(fechaInicio, fechaFin)
    errors.push(...erroresHorario)
    
    return errors
  }

  // NUEVA FUNCIÓN: Configurar validaciones en tiempo real para los campos de fecha
  static #configurarValidacionesFecha(idModal) {
    const fechaInicio = document.querySelector(`#${idModal} #fechaHoraInicio`)
    const fechaFin = document.querySelector(`#${idModal} #fechaHoraFin`)
    
    const validarHorario = (input, esInicio = true) => {
      if (!input.value) return
      
      const fecha = input.value
      const hora = parseInt(fecha.split('T')[1].split(':')[0])
      
      if (esInicio) {
        // Validar hora de inicio (7 AM - 9 PM)
        if (hora < 7 || hora > 21) {
          input.setCustomValidity('La hora de inicio debe estar entre las 7:00 AM y las 9:00 PM')
        } else {
          input.setCustomValidity('')
        }
      } else {
        // Validar hora de fin (8 AM - 10 PM)
        if (hora < 8 || hora > 22) {
          input.setCustomValidity('La hora de finalización debe estar entre las 8:00 AM y las 10:00 PM')
        } else {
          input.setCustomValidity('')
        }
      }
      
      // Mostrar el mensaje de validación
      input.reportValidity()
    }

    // NUEVA FUNCIONALIDAD: Validar mismo día
    const validarMismoDiaEnTiempoReal = () => {
      if (fechaInicio.value && fechaFin.value) {
        if (!Alquiler.#validarMismoDia(fechaInicio.value, fechaFin.value)) {
          fechaFin.setCustomValidity('El alquiler debe realizarse el mismo día que la fecha de inicio')
        } else {
          // Solo limpiar el error de mismo día, mantener otros errores de validación
          const horaFin = parseInt(fechaFin.value.split('T')[1].split(':')[0])
          if (horaFin >= 8 && horaFin <= 22) {
            fechaFin.setCustomValidity('')
          }
        }
        fechaFin.reportValidity()
      }
    }
    
    fechaInicio.addEventListener('input', () => {
      validarHorario(fechaInicio, true)
      validarMismoDiaEnTiempoReal()
    })
    fechaInicio.addEventListener('change', () => {
      validarHorario(fechaInicio, true)
      validarMismoDiaEnTiempoReal()
    })
    
    fechaFin.addEventListener('input', () => {
      validarHorario(fechaFin, false)
      validarMismoDiaEnTiempoReal()
    })
    fechaFin.addEventListener('change', () => {
      validarHorario(fechaFin, false)
      validarMismoDiaEnTiempoReal()
    })
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

  static #verificarAlquilerExistente(body) {
  // Obtener todos los datos actuales de la tabla
  const datosTabla = Alquiler.#table.getData()
  
  // Buscar si existe un alquiler con exactamente los mismos datos
  const alquilerExistente = datosTabla.find(alquiler => {
    return alquiler.socio.id === body.socio.id &&
           alquiler.instalacionDeportiva.id === body.instalacionDeportiva.id &&
           alquiler.fechaHoraInicio === body.fechaHoraInicio &&
           alquiler.fechaHoraFin === body.fechaHoraFin
  })
  
  return alquilerExistente
}

 static async #add() {
  try {
    // obtener del formulario el objeto con los datos que se envían a la solicitud POST
    const body = Alquiler.#getFormData()

    // Si getFormData devuelve null (por errores de validación), detener
    if (!body) {
      return
    }

    // verificar si los datos cumplen con las restricciones indicadas en el formulario HTML
    if (!Helpers.okForm('#form-alquiler')) {
      return
    }

    // NUEVA VALIDACIÓN: Verificar todas las restricciones de fechas
    const erroresFecha = Alquiler.#validarFechas(body.fechaHoraInicio, body.fechaHoraFin)
    if (erroresFecha.length > 0) {
      Toast.show({ 
        message: 'Errores en las fechas:\n' + erroresFecha.join('\n'), 
        mode: 'danger' 
      })
      return
    }

    // NUEVA FUNCIONALIDAD: Verificar si ya existe un alquiler idéntico
    const alquilerExistente = Alquiler.#verificarAlquilerExistente(body)
    
    if (alquilerExistente) {
      // Si existe un alquiler idéntico, mostrar mensaje informativo y cerrar modal
      const fechaInicio = DateTime.fromISO(alquilerExistente.fechaHoraInicio).setLocale('es')
      const fechaFin = DateTime.fromISO(alquilerExistente.fechaHoraFin).setLocale('es')
      
      Toast.show({ 
        message: `Ya existe un alquiler con estos mismos datos:\n` +
                `• ID: ${alquilerExistente.id}\n` +
                `• Socio: ${alquilerExistente.socio.nombre}\n` +
                `• Instalación: ${alquilerExistente.instalacionDeportiva.id} - ${alquilerExistente.instalacionDeportiva.tipoInstalacion}\n` +
                `• Inicio: ${fechaInicio.toFormat("dd/MM/yyyy HH:mm")}\n` +
                `• Fin: ${fechaFin.toFormat("dd/MM/yyyy HH:mm")}\n\n` +
                `No se creará un registro duplicado.`,
        mode: 'info',
        duration: 8000 // Mostrar por más tiempo para que se pueda leer
      })
      
      // Resaltar la fila existente en la tabla
      const filaExistente = Alquiler.#table.getRows().find(row => 
        row.getData().id === alquilerExistente.id
      )
      
      if (filaExistente) {
        // Desplazar la tabla hasta la fila y resaltarla temporalmente
        filaExistente.scrollTo()
        
        // Agregar clase de resaltado temporal
        const elemento = filaExistente.getElement()
        elemento.style.backgroundColor = '#fff3cd'
        elemento.style.border = '2px solid #ffc107'
        
        // Remover el resaltado después de 3 segundos
        setTimeout(() => {
          elemento.style.backgroundColor = ''
          elemento.style.border = ''
        }, 3000)
      }
      
      Alquiler.#modal.remove()
      return
    }

    // Si no existe duplicado, proceder con la creación normal
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

      // Si getFormData devuelve null (por errores de validación), detener
      if (!body) {
        return
      }

      // verificar si los datos cumplen con las restricciones indicadas en el formulario HTML
      if (!Helpers.okForm('#form-alquiler')) {
        return
      }

      // NUEVA VALIDACIÓN: Verificar todas las restricciones de fechas
      const erroresFecha = Alquiler.#validarFechas(body.fechaHoraInicio, body.fechaHoraFin)
      if (erroresFecha.length > 0) {
        Toast.show({ 
          message: 'Errores en las fechas:\n' + erroresFecha.join('\n'), 
          mode: 'danger' 
        })
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
          <strong>Instalación:</strong> ${rowData.instalacionDeportiva.id} - ${rowData.instalacionDeportiva.descripcion}
        </div>
        
        <div class="mb-3">
          <strong>Fecha y hora de inicio:</strong> ${fechaInicioFormateada}
        </div>
        
        <div class="mb-3">
          <strong>Fecha y hora de fin:</strong> ${fechaFinFormateada}
        </div>
        
        <div class="mb-2">
          <strong>Alquilado por:</strong> ${rowData.socio.id} - ${rowData.socio.nombre}
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
    
    // MODIFICACIÓN: establecer fecha y hora por defecto respetando horarios permitidos
    const now = DateTime.now()
    let horaInicio = now.hour
    
    // Ajustar hora de inicio si está fuera del rango permitido (7-21)
    if (horaInicio < 7) horaInicio = 7
    if (horaInicio > 21) horaInicio = 7 // Si es muy tarde, usar 7 AM del día siguiente o actual
    
    const fechaInicioDefault = now.set({ hour: horaInicio, minute: 0 })
    let fechaFinDefault = fechaInicioDefault.plus({ hours: 1 })
    
    // Verificar que la hora de fin esté en el rango permitido (8-22)
    if (fechaFinDefault.hour > 22) {
      fechaFinDefault = fechaInicioDefault.set({ hour: 22, minute: 0 })
    }
    
    document.querySelector(`#${idModal} #fechaHoraInicio`).value = fechaInicioDefault.toFormat('yyyy-MM-dd\'T\'HH:mm')
    document.querySelector(`#${idModal} #fechaHoraFin`).value = fechaFinDefault.toFormat('yyyy-MM-dd\'T\'HH:mm')
    
    // Limpiar campos calculados
    document.querySelector(`#${idModal} #horas`).value = ''
    document.querySelector(`#${idModal} #valorHora`).value = ''
    document.querySelector(`#${idModal} #valorAlquiler`).value = ''
  }

  // NUEVA FUNCIONALIDAD: Configurar validaciones de horario y mismo día
  Alquiler.#configurarValidacionesFecha(idModal)

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

  // Obtener referencias a los campos de fecha
  const fechaInicioInput = document.querySelector(`#${Alquiler.#modal.id} #fechaHoraInicio`)
  const fechaFinInput = document.querySelector(`#${Alquiler.#modal.id} #fechaHoraFin`)

  // NUEVA VALIDACIÓN: Verificar horarios en los campos de entrada
  let fechaInicio = fechaInicioInput.value
  let fechaFin = fechaFinInput.value

  // Validar que ambas fechas estén presentes
  if (!fechaInicio || !fechaFin) {
    Toast.show({ 
      message: 'Debe especificar tanto la fecha de inicio como la de finalización', 
      mode: 'danger' 
    })
    return null
  }

  // NUEVA VALIDACIÓN: Verificar que las fechas sean del mismo día
  if (!Alquiler.#validarMismoDia(fechaInicio, fechaFin)) {
    Toast.show({ 
      message: 'El alquiler debe realizarse dentro del mismo día. La fecha de inicio y fin deben ser el mismo día.', 
      mode: 'danger' 
    })
    return null
  }

  // Validar horarios antes de procesar
  if (fechaInicio) {
    const horaInicio = parseInt(fechaInicio.split('T')[1].split(':')[0])
    if (horaInicio < 7 || horaInicio > 21) {
      fechaInicioInput.setCustomValidity('La hora de inicio debe estar entre las 7:00 AM y las 9:00 PM')
      fechaInicioInput.reportValidity()
      return null
    } else {
      fechaInicioInput.setCustomValidity('')
    }
  }

  if (fechaFin) {
    const horaFin = parseInt(fechaFin.split('T')[1].split(':')[0])
    if (horaFin < 8 || horaFin > 22) {
      fechaFinInput.setCustomValidity('La hora de finalización debe estar entre las 8:00 AM y las 10:00 PM')
      fechaFinInput.reportValidity()
      return null
    } else {
      fechaFinInput.setCustomValidity('')
    }
  }

  // Buscar los objetos completos basados en los IDs seleccionados
  const socioSeleccionado = Alquiler.#socios.find(s => s.id === selectSocios.value)
  const instalacionSeleccionada = Alquiler.#instalaciones.find(i => i.id === selectInstalaciones.value)

  // Validar y intercambiar fechas si es necesario
  if (fechaInicio && fechaFin) {
    const dateInicio = new Date(fechaInicio)
    const dateFin = new Date(fechaFin)
    
    // Si la fecha fin es anterior a la fecha inicio, intercambiarlas
    if (dateFin < dateInicio) {
      const temp = fechaInicio
      fechaInicio = fechaFin
      fechaFin = temp
      
      // Actualizar los campos en el DOM para mostrar el cambio
      fechaInicioInput.value = fechaInicio
      fechaFinInput.value = fechaFin
      
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