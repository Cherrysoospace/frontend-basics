export default class TipoCancha {
  constructor() {
    throw new Error('No requiere instancias, todos los métodos son estáticos. Use TipoCancha.init()')
  }

  static #table
  static async init() {

  try {
    // intentar cargar los datos de los tipos de canchas
    const response = await Helpers.fetchJSON(`${urlAPI}/canchas/tipos`)

    if (response.message !== 'ok') {
      throw new Error(response.message)
    }

    // agregar al <main> de index.html la capa que contendrá la tabla
    document.querySelector('main').innerHTML = `
      <div class="p-1 w-full">
          <div id="table-container" class="m-1"></div>
      </dv>`

    // ver https://tabulator.info/docs/6.3/columns#definition 
    // ver https://tabulator.info/docs/6.3/format 
    TipoCancha.#table = new Tabulator('#table-container', {
    height: tableHeight,
    locale: true,
    langs: {es : es419},
    data: response.data,
    layout:"fitColumns",      //fit columns to width of table
    responsiveLayout:"hide",  //hide columns that don't fit on the table
    addRowPos:"top",          //when adding a new row, add it to the top of the table
    history:true,             //allow undo and redo actions on the table
    pagination:"local",       //paginate the data
    paginationSize:7,         //allow 7 rows per page of data
    paginationCounter:"rows", //display count of paginated rows in footer
    movableColumns:true,      //allow column order to be changed
    initialSort:[             //set the initial sort order of the data
        {column:'id', dir:"asc"}, //Indica como se organiza la tabla
    ],
    columnDefaults:{
        tooltip:true,         //show tool tips on cells
    },
      columns: [ // definir las columnas de la tabla
        { title: 'ID', field: 'ordinal', width: 100, hozAlign: 'center' },
        { title: 'LLAVE | CLAVE', field: 'key', width: 250 },
        { title: 'NOMBRE', field: 'value', hozAlign: 'left' }, // utilizar ancho remanente
      ],
      responsiveLayout: false, // activado el scroll horizontal, también: ['hide'|true|false]
      initialSort: [ // establecer el ordenamiento inicial de los datos
        { column: 'value', dir: 'asc' },
      ],
      columnDefaults: { 
        tooltip: true  // mostrar información sobre las celdas
      },
    })
  } catch (e) {
    Toast.show({ title: 'Ventas', message: e.message, mode: 'danger', error: e })
  }

  return this
}
}
