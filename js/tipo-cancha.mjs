export default class TipoCancha {
  static #table

  constructor() {
    throw new Error('No requiere instancias, todos los métodos son estáticos. Use TipoCancha.init()')
  }

  static async init() {
    try {
      // intentar cargar los datos de los tipos de canchas
      const response = await Helpers.fetchJSON(`${urlAPI}/canchas/tipos`)
      console.log(response.data)

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
      TipoCancha.#table = new Tabulator('#table-container', {
        height: tableHeight, // establecer la altura, habilita el DOM virtual y mejora la velocidad de procesamiento
        locale: "es-419", // utilizar la configuración de idioma local
        langs: { es: es419 },
        data: response.data, // asignar los datos a la tabla
        layout: 'fitColumns', // ajustar columnas al ancho disponible
        responsiveLayout: false,
        addRowPos: 'top',
        history: true,
        pagination: 'local',
        paginationSize: 7,
        paginationCounter: 'rows',
        movableColumns: true,
        initialSort: [{ column: 'id', dir: 'asc' }],
        columnDefaults: { tooltip: true },
        columns: [
          // definir las columnas de la tabla
          { title: 'ID', field: 'ordinal', width: 100, hozAlign: 'center' },
          { title: 'LLAVE | CLAVE', field: 'key', width: 250 },
          { title: 'NOMBRE', field: 'value', hozAlign: 'left' }, // No se indica width, utilizar el ancho remanente
        ],
        responsiveLayout: false, // activado el scroll horizontal, también: ['hide'|true|false]
        initialSort: [
          // establecer el ordenamiento inicial de los datos
          { column: 'value', dir: 'asc' },
        ],
        columnDefaults: {
          tooltip: true, // mostrar información sobre las celdas
        },
      })
    } catch (e) {
      Toast.show({ title: 'Ventas', message: e.message, mode: 'danger', error: e })
    }

    return this
  }
}
