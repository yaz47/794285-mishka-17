const header = document.querySelector('.site-header');

if (header) {
  const toggle = header.querySelector('.site-header__toggle');
  const nav = header.querySelector('.site-header__navigation');
  const userInterface = header.querySelector('.site-header__user-interface');

  const toggleMenu = () => {
    toggle.classList.toggle('toggle--active');
    nav.classList.toggle('site-header__navigation--closed');
    userInterface.classList.toggle('site-header__user-interface--closed');
  }

  header.classList.remove('site-header--no-js');
  toggleMenu();

  toggle.onclick = toggleMenu;
}

const modal = document.querySelector('.modal');

if (modal) {
  document.addEventListener('click', (evt) => {
    if (evt.target.closest('.js--modal-cart')) {
      evt.preventDefault();
      modal.classList.remove('modal--hide');
    }
  });

  document.addEventListener('keyup', (evt) => {
    if (evt.keyCode === 27) {
      modal.firstElementChild.classList.add('modal__section--zoomOut');
    }
  });

  document.addEventListener('click', (evt) => {
    if (evt.target.matches('.modal')) {
      evt.target.firstElementChild.classList.add('modal__section--zoomOut');
    }
  });

  document.addEventListener('animationend', (evt) => {
    if (evt.target.matches('.modal__section--zoomOut')) {
      evt.target.closest('.modal').classList.add('modal--hide');
      evt.target.classList.remove('modal__section--zoomOut');
    }
  });
}
