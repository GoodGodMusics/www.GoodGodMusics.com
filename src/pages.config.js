import About from './pages/About';
import Admin from './pages/Admin';
import BibleTimeline from './pages/BibleTimeline';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import Discover from './pages/Discover';
import Home from './pages/Home';
import Music from './pages/Music';
import Store from './pages/Store';
import TheBook from './pages/TheBook';
import UserProfile from './pages/UserProfile';
import Forums from './pages/Forums';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Admin": Admin,
    "BibleTimeline": BibleTimeline,
    "Checkout": Checkout,
    "Contact": Contact,
    "Discover": Discover,
    "Home": Home,
    "Music": Music,
    "Store": Store,
    "TheBook": TheBook,
    "UserProfile": UserProfile,
    "Forums": Forums,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};