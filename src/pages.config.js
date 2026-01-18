import About from './pages/About';
import Admin from './pages/Admin';
import BibleTimeline from './pages/BibleTimeline';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import Home from './pages/Home';
import Store from './pages/Store';
import Discover from './pages/Discover';
import Music from './pages/Music';
import TheBook from './pages/TheBook';
import UserProfile from './pages/UserProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Admin": Admin,
    "BibleTimeline": BibleTimeline,
    "Checkout": Checkout,
    "Contact": Contact,
    "Home": Home,
    "Store": Store,
    "Discover": Discover,
    "Music": Music,
    "TheBook": TheBook,
    "UserProfile": UserProfile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};