export default class Alquiler {
 static #mode //atributo de clase privado

static #table

  constructor() {
    throw new Error('No requiere instancias, todos los métodos son estáticos. Use Instalacion.init()')
  }

  static async init() {
  try {
    const response = await Helpers.fetchJSON(`${urlAPI}/alquiler`)

    if (response.message !== 'ok') {
      throw new Error(response.message)
    }

    document.querySelector('main').innerHTML = `
      <div class="p-1 w-full">
          <div id="table-container" class="m-1"></div>
      </div>`

    Alquiler.#table = new Tabulator('#table-container', {
    height: tableHeight,
    locale: true, // utilizar la configuración de idioma local
  langs: { es: es419 }, // utilizar el código de idioma importado

      data: response.data,
      layout: "fitColumns",
      responsiveLayout: "hide",
      addRowPos: "top",
      history: true,
      pagination: "local",
      paginationSize: 7,
      paginationCounter: "rows",
      movableColumns: true,
      initialSort: [{ column: 'id', dir: "asc" }],
      columnDefaults: { tooltip: true },
      columns: [
        {formatter: editRowButton, hozAlign: 'center', width: 50, cellClick: Alquiler.#editRowClick},
        {formatter: deleteRowButton, hozAlign: 'center', width: 50, cellClick: Alquiler.#deleteRowClick},
        {title: 'ID', field: 'id', hozAlign: 'center', width: 95},
        {title: 'INICIO', field: 'fechaHoraInicio', hozAlign: 'center', formatter: (cell) => {
    const value = cell.getValue()
    try {
      return DateTime.fromISO(value).toFormat(window.formatDateTime.outputFormat)
    } catch {
      return window.formatDateTime.invalidPlaceholder
    }
  } },
        {title: 'FIN', field: 'fechaHoraFin', hozAlign: 'center', formatter: (cell) => {
    const value = cell.getValue()
    try {
      return DateTime.fromISO(value).toFormat(window.formatDateTime.outputFormat)
    } catch {
      return window.formatDateTime.invalidPlaceholder
    }
  }},
        {title: 'HORAS', field: 'horas', hozAlign: 'center', width: 80, formatter: 'money', formatterParams: { precision: 0 }},
        {title: 'Vr. HORA', field: 'instalacionDeportiva.valorHora', hozAlign: 'center', width: 95, formatter: 'money'},
        {title: 'Vr. TOTAL', field: 'valorAlquiler', hozAlign: 'center', width: 95, formatter: 'money'},
        {title: 'SOCIO', field: 'socio.id', hozAlign: 'center', width: 95},
        {title: 'INSTALACION', field: 'instalacionDeportiva.tipoInstalacion', hozAlign: 'left'}
      ]
    })
  } catch (e) {
    Toast.show({ title: 'Alquiler', message: e.message, mode: 'danger', error: e })
  }

  return this
}

  static #editRowClick = (e, cell)=>{
    console.log('Editando el registro',cell.getRow().getData())
  }

  static #deleteRowClick = (e, cell)=>{
    console.log(`Eliminando el registro ${cell.getRow().getData().id}`)
    //cellClick:function(e, cell){console.log("cell click")},
  }

  /*
  {
    "horas": 4,
    "instalacionDeportiva": {
      "area": 406,
      "descripcion": "Piscina semiolímpica para entrenamientos de equipos de al menos 3 personas",
      "tipoInstalacion": "Pisicina Olímpica",
      "ancho": 14,
      "largo": 29,
      "valorHora": 15000,
      "id": "LRDTT",
      "olimpica": true
    },
    "socio": {
      "direccion": "Calle 40 #18-90",
      "id": "00TTL",
      "telefono": "316 334 5567",
      "nombre": "Daniela López"
    },
    "valorAlquiler": 60000,
    "fechaHoraInicio": "2025-05-01T10:00",
    "id": "H4FCM",
    "fechaHoraFin": "2025-05-01T14:00"
  }
   */
}