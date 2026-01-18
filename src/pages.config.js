import About from './pages/About';
import BibleTimeline from './pages/BibleTimeline';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import Home from './pages/Home';
import Store from './pages/Store';
import Admin from './pages/Admin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "BibleTimeline": BibleTimeline,
    "Checkout": Checkout,
    "Contact": Contact,
    "Home": Home,
    "Store": Store,
    "Admin": Admin,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};