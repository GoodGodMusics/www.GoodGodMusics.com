import About from './pages/About';
import Admin from './pages/Admin';
import BibleStudyAI from './pages/BibleStudyAI';
import BibleTimeline from './pages/BibleTimeline';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import Forums from './pages/Forums';
import Home from './pages/Home';
import Music from './pages/Music';
import Store from './pages/Store';
import TheBook from './pages/TheBook';
import UserProfile from './pages/UserProfile';
import Quiz from './pages/Quiz';
import RewardCenter from './pages/RewardCenter';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Admin": Admin,
    "BibleStudyAI": BibleStudyAI,
    "BibleTimeline": BibleTimeline,
    "Checkout": Checkout,
    "Contact": Contact,
    "Forums": Forums,
    "Home": Home,
    "Music": Music,
    "Store": Store,
    "TheBook": TheBook,
    "UserProfile": UserProfile,
    "Quiz": Quiz,
    "RewardCenter": RewardCenter,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};