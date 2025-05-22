/**
 * Intentar crear una tabla con el ejemplo de Tabulator
 */
// los import locales de JS tienen rutas relativas a la ruta del script que hace el enrutamiento
import * as bootstrap from '../utils/bootstrap-5.3.3/js/bootstrap.bundle.min.js'
import { DateTime, Duration, Settings } from '../utils/luxon3x.min.js'
import Exception from '../utils/own/exception.js'
import Helpers from '../utils/own/helpers.js'
import icons from '../utils/own/icons.js'
import Popup from '../utils/own/popup.js'
import Dialog from '../utils/own/dialog.js'
import Toast from '../utils/own/toast.js'
import * as Popper from '../utils/popper/popper.min.js'
import { TabulatorFull as Tabulator } from '../utils/tabulator-6.3/js/tabulator_esm.min.js'
import es419 from '../utils/tabulator-6.3/js/es-419.js'

class App {
  static async main() {
    Settings.defaultLocale = 'es-419' // fechas en español de Luxon
    window.Exception = Exception
    // los recursos locales usan rutas relativas empezando por la carpeta principal del proyecto
    const config = await Helpers.fetchJSON('./resources/assets/config.json')

    // evite siempre los datos quemados en el código
    window.urlAPI = config.url
    // Ver: https://javascript.info/browser-environment (DOM|BOM|JavaScript)

    // Las clases importadas se asignan a referencias de la ventana actual:
    window.icons = icons
    window.DateTime = DateTime
    window.formatDateTime = {
      inputFormat: 'iso', // "yyyy-MM-dd'T'HH:mm:ss'Z'",  "yyyy-MM-dd'T'HH:mm:ss'Z'
      outputFormat: 'yyyy-MM-dd hh:mm a',
      invalidPlaceholder: 'fecha inválida',
    }
    window.Duration = Duration
    window.Helpers = Helpers
    window.Tabulator = Tabulator
    window.Toast = Toast
    window.Modal = Popup
    window.current = null // miraremos si se requiere...
    window.es419 = es419

    // lo siguiente es para estandarizar el estilo de los botones usados para add, edit y delete en las tablas
    window.addRowButton = `<button id='add-row' class='btn btn-info btn-sm'>${icons.plusSquare}&nbsp;&nbsp;Nuevo registro</button>`
    window.editRowButton = () => `<button id="edit-row" class="border-0 bg-transparent" data-bs-toggle="tooltip" title="Editar">${icons.edit}</button>`
    window.deleteRowButton = () => `<button id="delete-row" class="border-0 bg-transparent" data-bs-toggle="tooltip" title="Eliminar">${icons.delete}</button>`

    // lo siguiente es para estandarizar los botones de los formularios
    window.addButton = `${icons.plusSquare}&nbsp;&nbsp;<span>Agregar</span>`
    window.editButton = `${icons.editWhite}&nbsp;&nbsp;<span>Actualizar</span>`
    window.deleteButton = `${icons.deleteWhite}<span>Eliminar</span>`
    window.cancelButton = `${icons.xLg}<span>Cancelar</span>`
    window.tableHeight = 'calc(100vh - 175px)' // la altura de todos los elementos de tipo Tabulator que mostrará la aplicación

    document.querySelector('#app-logo').innerHTML = icons.sportIcon

    try {
      // confirmación de acceso a la API REST
      const response = await Helpers.fetchJSON(`${urlAPI}/`)
      if (response.message === 'ok') {
        Toast.show({ title: 'Hola', message: response.data, duration: 3000 })
        App.#mainMenu()
      } else {
        Toast.show({ message: 'Problemas con el servidor de datos', mode: 'danger', error: response })
      }
    } catch (e) {
      Toast.show({ message: 'Falló la conexión con el servidor de datos', mode: 'danger', error: e })
    }
    return true
  }

  /**
   * Determina la acción a llevar a cabo según la opción elegida en el menú principal
   * @param {String} option El texto del ancla seleccionada
   */
  static async #mainMenu() {
    // referenciar todos los elementos <a>...</a> que hayan dentro de main-menu
    const listOptions = document.querySelectorAll('#main-menu a')

    // asignarle un gestor de evento clic a cada opción del menú
    listOptions.forEach(item =>
      item.addEventListener('click', async event => {
        let option = ''
        try {
          event.preventDefault()
          option = (event.target.text ?? 'Inicio').trim()
          document.querySelector('main').innerText = ''

          if (option === 'Inicio') {
            document.querySelector('main').classList.add('background-main')
          }

          switch (option) {
            case 'Inicio':
              document.querySelector('main').innerText = ''
              break

            case 'Socios':
              const { default: Socios } = await import('./socio.mjs')
              Socios.init()
              break
            case 'Canchas de tenis':
              const { default: Tenis } = await import('./instalacion.mjs')
              Tenis.init('canchatennis')
              break
            case 'Canchas multipropósito':
              const { default: Multiproposito } = await import('./instalacion.mjs')
              Multiproposito.init('canchamultiproposito')
              break
            case 'Piscinas':
              const { default: Piscina } = await import('./instalacion.mjs')
              Piscina.init('piscina')
              break
            case 'Tipos de canchas':
              const { default: Estados } = await import('./tipo-cancha.mjs') //lo que le sigue al default, es como un nombre de parametro
              Estados.init()                                                 //se recomienda que se llama igual que la clase default para evitar confusiones
              break                                                          //Es un buena practica, ya que esta mal visto llamar multiples clase al tiempo, se puede, pero no es recomendable
            case 'Alquiler':
              const { default: Alquiler } = await import('./alquiler.mjs')
              Alquiler.init('alquiler')
              break
            case 'Todas las canchas':
              const { default: CanchasTodas } = await import('./canchas-todas.mjs')
              CanchasTodas.init()
              break
            case 'Acerca de...':
              document.querySelector('main').innerHTML = await Helpers.fetchText('./resources/html/resume.html')
              break

            default:
              // generar una advertencia cuando se pulse sobre una opción inexistente
              if (option !== 'Instalaciones') {
                Toast.show({ message: `La opción ${option} no ha sido implementada`, mode: 'warning', delay: 3000, close: false })
                console.warn('Fallo en ', event.target)
              }
          }
        } catch (e) {
          Toast.show({ message: `Falló la carga del módulo ${option}`, mode: 'danger', error: e })
        }
        return true
      })
    )
  }
}

App.main()
