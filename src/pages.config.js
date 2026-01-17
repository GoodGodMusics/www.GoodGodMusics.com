import Home from './pages/Home';
import BibleTimeline from './pages/BibleTimeline';
import Store from './pages/Store';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Contact from './pages/Contact';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "BibleTimeline": BibleTimeline,
    "Store": Store,
    "Checkout": Checkout,
    "About": About,
    "Contact": Contact,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};