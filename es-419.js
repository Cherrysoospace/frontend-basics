// exportar el idioma por defecto para Tabulator

export default {
  columns: {
    name: 'Nombre' //replace the title of column name with the value "Name"
  },
  data: {
    loading: 'Cargando', //data loader text
    error: 'Error' //data error text
  },
  groups: {
    //copy for the auto generated item count in group header
    item: 'item', //the singular  for item
    items: 'items' //the plural for items
  },
  pagination: {
    page_size: 'Tamaño de página', //label for the page size select element
    page_title: 'Mostrar página', //tooltip text for the numeric page button, appears in front of the page number (eg. "Show Page" will result in a tool tip of "Show Page 1" on the page 1 button)
    first: 'Inicio', //text for the first page button
    first_title: 'Primera página', //tooltip text for the first page button
    last: 'Última',
    last_title: 'Última página',
    prev: 'Anterior',
    prev_title: 'Página anterior',
    next: 'Siguiente',
    next_title: 'Página siguiente',
    all: 'Todo',
    counter: {
      showing: 'Mostrar',
      of: 'de',
      rows: 'filas',
      pages: 'páginas'
    }
  },
  headerFilters: {
    default: 'columna de filtro...', //default header filter placeholder text
    columns: {
      name: 'nombre del filtro...' //replace default header filter text for column name
    }
  }
}
