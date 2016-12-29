import {EYE_DROPPER, PREFIX} from '../config';
import MESSAGE_TYPES from '../message_types';
import Loupe from './Loupe';
import {createColorBox, updateColorBox} from './ColorBox';
import {appendChildren} from '../utils/dom';
import Screenshot from './Screenshot';

let colorBox;

const App = {
  init: function () {
    Loupe.init();
    colorBox = createColorBox(PREFIX);
    Screenshot.init();
    this.processExtensionMessage = this.processExtensionMessage.bind(this);
    this.moveEyeDropper = this.moveEyeDropper.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleViewChange = this.handleViewChange.bind(this);
    this.activate = this.activate.bind(this);
    chrome.runtime.onMessage.addListener(this.processExtensionMessage);
  },

  processExtensionMessage: function(request, sender) {
    switch (request.type) {
      case MESSAGE_TYPES.SCREENSHOT_DATA: {
        Screenshot.setData(request.data);
        this.activate();
        break;
      }
      default: {
        console.error('[EYEDROPPER] Extention message not recognized', request);
      }
    }
  },

  activate: function() {
    document.addEventListener('mousemove', this.moveEyeDropper);
    document.addEventListener('click', this.readColor);
    document.addEventListener('keyup', this.handleKeyPress);
    document.addEventListener('scroll', this.handleViewChange);
    window.addEventListener('resize', this.handleViewChange);

    appendChildren(EYE_DROPPER, colorBox.container, Loupe.render());
    Screenshot.render();

    this.appendUI();
  },

  deactivate: function() {
    document.removeEventListener('mousemove', this.moveEyeDropper);
    document.removeEventListener('click', this.readColor);
    document.removeEventListener('keyup', this.handleKeyPress);
    document.removeEventListener('scroll', this.handleViewChange);
    window.removeEventListener('resize', this.handleViewChange);
    this.removeUI();
  },

  refresh: function () {
    this.removeUI();
    chrome.runtime.sendMessage(null, {type: MESSAGE_TYPES.SCREENSHOT_REQUEST}, () => {
      Screenshot.render();
      this.appendUI();
    });
  },

  removeUI: function() {
    const {body} = document;
    body.style.cursor = null;
    body.style.pointerEvents = null;

    if (document.getElementById(PREFIX)) {
      body.removeChild(EYE_DROPPER);
    }
  },

  appendUI: function () {
    const {body} = document;
    body.style.cursor = 'crosshair';
    body.style.pointerEvents = 'none';

    body.appendChild(EYE_DROPPER);
  },

  moveEyeDropper: function(event) {
    const {pageX, pageY} = event;
    const {scrollTop, scrollLeft} = document.body;
    const x = pageX - scrollLeft;
    const y = pageY - scrollTop;
    const colorData = Screenshot.getColorData(x, y);
    Loupe.move(pageX, pageY, colorData);
  },

  readColor: function () {
    const color = Loupe.getMiddlePixelColor();
    updateColorBox(colorBox, color);
  },

  handleKeyPress: function (event) {
    const {which} = event;
    event.preventDefault();
    switch (which) {
      // Deactivate extension with <esc> key
      case 27:
        this.deactivate();
        break;

      // Reload extension with <R> key
      case 82:
        this.refresh();
        break;
      default:
    }
    // event.preventDefault();
  },

  handleViewChange: function() {
    this.refresh();
  }
};

export default App;
