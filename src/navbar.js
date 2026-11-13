// Closes the mobile dropdown menu after a link is tapped, or when the user taps outside the navbar.
// Flowbite opens/closes the menu (data-collapse-toggle="navbar-default") but never closes it on its own.
export function navbar() {
  const nav = document.querySelector('nav')
  const menu = document.getElementById('navbar-default')
  const toggle = document.querySelector('[data-collapse-toggle="navbar-default"]')
  if (!nav || !menu || !toggle) return

  const isOpen = () => !menu.classList.contains('hidden')

  // the toggle button is hidden on desktop (md:hidden), so it is only visible on mobile
  const isMobile = () => toggle.offsetParent !== null

  const closeMenu = () => {
    if (!isMobile() || !isOpen()) return

    // use Flowbite's own Collapse instance so its open/closed state stays in sync,
    // otherwise the next tap on the menu button would do nothing
    const collapse = window.FlowbiteInstances?.getInstance('Collapse', 'navbar-default')
    if (collapse) {
      collapse.collapse()
    } else {
      menu.classList.add('hidden')
      toggle.setAttribute('aria-expanded', 'false')
    }
  }

  // close after choosing a section
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu)
  })

  // close when tapping anywhere outside the navbar
  document.addEventListener('click', event => {
    if (!nav.contains(event.target)) closeMenu()
  })
}
