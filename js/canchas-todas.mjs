export default class CanchasTodas {
  static #table

  constructor() {
    throw new Error('No requiere instancias, todos los métodos son estáticos. Use CanchasTodas.init()')
  }

  static async init() {
    try {
      const response = await Helpers.fetchJSON(`${urlAPI}/canchas/todas`) // ← Asegúrate de que esta ruta devuelva TODAS las instalaciones

      if (response.message !== 'ok') {
        throw new Error(response.message)
      }

      document.querySelector('main').innerHTML = `
        <div class="p-1 w-full">
          <div id="table-container" class="m-1"></div>
        </div>`

      CanchasTodas.#table = new Tabulator('#table-container', {
        height: tableHeight,
        data: response.data,
        layout: 'fitColumns',
        responsiveLayout: 'hide',
        locale: true,
        langs: { es: es419 },
        pagination: 'local',
        paginationSize: 7,
        paginationCounter: 'rows',
        initialSort: [{ column: 'id', dir: 'asc' }],
        columnDefaults: { tooltip: true },
        columns: [
          { title: 'ID', field: 'id', hozAlign: 'center', width: 95 },
          { title: 'ANCHO', field: 'ancho', hozAlign: 'center', formatter: 'money' },
          { title: 'LARGO', field: 'largo', hozAlign: 'center', formatter: 'money' },
          { title: 'ÁREA', field: 'area', hozAlign: 'center', formatter: 'money' },
          { title: 'Vr. HORA', field: 'valorHora', hozAlign: 'center', formatter: 'money', formatterParams: { precision: 0 } },
          { title: 'TIPO', field: 'tipoInstalacion', hozAlign: 'center' },
          { title: 'DESCRIPCIÓN', field: 'descripcion', hozAlign: 'left' }
        ]
      })
    } catch (e) {
      Toast.show({ title: 'Instalaciones', message: e.message, mode: 'danger', error: e })
    }

    return this
  }
}