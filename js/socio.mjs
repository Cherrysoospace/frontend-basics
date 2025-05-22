export default class Socio {
  constructor() {
    throw new Error('No requiere instancias, todos los métodos son estáticos. Use Socio.init()')
  }

  
  static async init() {
    document.querySelector('main').innerHTML = '<div id="table"></div>'
    const response = await Helpers.fetchJSON(`${urlAPI}/socio`)
    console.log(response)

  const table = new Tabulator("#table", {
    data:response.data,           //load row data from array
    height: tableHeight,
    locale: true, // utilizar la configuración de idioma local
    langs: { es: es419 }, 
    layout:"fitColumns",      //fit columns to width of table
    responsiveLayout:"hide",  //hide columns that don't fit on the table
    addRowPos:"top",          //when adding a new row, add it to the top of the table
    history:true,             //allow undo and redo actions on the table
    pagination:"local",       //paginate the data
    paginationSize:7,         //allow 7 rows per page of data
    paginationCounter:"rows", //display count of paginated rows in footer
    movableColumns:true,      //allow column order to be changed
    initialSort:[             //set the initial sort order of the data
        {column:'nombre', dir:"asc"},
    ],
    columnDefaults:{
        tooltip:true,         //show tool tips on cells
    },
    columns:[                 //define the table columns
        {formatter: editRowButton, hozAlign: 'center', width: 50, cellClick: Socio.#editRowClick},
        {formatter: deleteRowButton, hozAlign: 'center', width: 50, cellClick: Socio.#deleteRowClick},
        {title:'IDENTIFICACION', field:'id', hozAlign:'center', width: 100},
        {title:'NOMBRE', field:'nombre', width: 175},
        {title:'TELEFONO', field:'telefono', width: 125},
        {title:'DIRECCION', field: 'direccion', hozAlign:'left'},
    ],
});
  }

  static #editRowClick = (e, cell)=>{
    console.log('Editando el registro',cell.getRow().getData())
  }

  static #deleteRowClick = (e, cell)=>{
    console.log(`Eliminando el registro ${cell.getRow().getData().id}`)
    //cellClick:function(e, cell){console.log("cell click")},
  }

}
