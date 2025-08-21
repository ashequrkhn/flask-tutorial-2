import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Maps from "./pages/Maps";
import Login from "./pages/Login";

function App() {
  return (
    <>
      <div className="flex-container">
        <nav className="navbar">
          <img
            src="/Mnemo.png"
            alt="Logo"
            className="logo"
            style={{ width: "150px", height: "150px" }}
          />
          <Link to="/login" className="nav-margin">
            Login
          </Link>

          <Link to="/" className="nav-margin">
            Home
          </Link>
          <Link to="/about" className="nav-margin">
            About
          </Link>
          <Link to="/Maps" className="nav-margin">
            Maps
          </Link>
        </nav>

        <div style={{ padding: "2rem" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/maps" element={<Maps />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
