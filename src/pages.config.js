import Home from './pages/Home';
import BibleTimeline from './pages/BibleTimeline';
import Store from './pages/Store';
import Checkout from './pages/Checkout';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "BibleTimeline": BibleTimeline,
    "Store": Store,
    "Checkout": Checkout,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};