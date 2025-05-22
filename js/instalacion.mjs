export default class Instalacion {

  
  static #mode //atributo de clase privado
  static #table

  constructor() {
    
    throw new Error('No requiere instancias, todos los métodos son estáticos. Use Instalacion.init()')
  }

  static async init(mode = '') {
    Instalacion.#mode = mode
  try {
    // intentar cargar los datos de los tipos de canchas
    const response = await Helpers.fetchJSON(`${urlAPI}/${mode}`)

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
    Instalacion.#table = new Tabulator('#table-container', {
    height: tableHeight,
    data: response.data,
    locale: true, // utilizar la configuración de idioma local
    langs: { es: es419 }, // utilizar el código de idioma impo
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
      columns:[                 //define the table columns
        {formatter: editRowButton, hozAlign: 'center', width: 50, cellClick: Instalacion.#editRowClick},
        {formatter: deleteRowButton, hozAlign: 'center', width: 50, cellClick: Instalacion.#deleteRowClick},
        {title:'ID', field:'id', hozAlign:'center', width: 95},
        {title:'ANCHO', field:'ancho', hozAlign:'center', width: 95, formatter: 'money'},
        {title:'LARGO', field:'largo', hozAlign:'center', width: 95,  formatter: 'money'},
        {title:'AREA', field:'area', hozAlign:'center', width: 95,  formatter: 'money'},
        {title:'Vr. HORA', field:'valorHora', hozAlign:'center', width: 95,  formatter: 'money', formatterParams: {precision: 0}},
        Instalacion.#column(),
        {title:'DESCRIPCION', field:'descripcion', hozAlign:'left'}
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

static #column = () =>{
    if (Instalacion.#mode == 'canchatennis') { //Preguntar por el triple igual, que es una comparacion fuerte
     return {title:'TIPO', field:'tipoInstalacion'}
    } else if (Instalacion.#mode == 'canchamultiproposito') { //Preguntar por el triple igual, que es una comparacion fuerte
     return {title:'GRADERIA', field:'graderia', width: 112, hozAlign: 'center', formatter: 'tickCross'}
    } else {
      return {title:'OLIMPICA', field:'olimpica', width: 112, hozAlign: 'center', formatter: 'tickCross'}
    }
  }

  static #editRowClick = (e, cell)=>{
    console.log('Editando el registro',cell.getRow().getData())
  }

  static #deleteRowClick = (e, cell)=>{
    console.log(`Eliminando el registro ${cell.getRow().getData().id}`)
    //cellClick:function(e, cell){console.log("cell click")},
  }
   
}

  
  
  
