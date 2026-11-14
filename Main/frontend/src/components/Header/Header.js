import React, { useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ButtonComponent from "../Button/ButtonComponent";
import Link from "@mui/material/Link";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useMediaQuery } from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import "./Header.css";
import Automn_logo from "../../assets/Automn_logo.png";
import { notifyAuthChange } from "../../auth";

export default function Header() {
  const textColor = "#942d2d";
  const isSmallScreen = useMediaQuery("(max-width:1000px)");
  const navigate = useNavigate();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem("isAdminAuth") === "true");
  const [isUser, setIsUser] = useState(localStorage.getItem("isUserAuth") === "true");

  useEffect(() => {
    const syncAuth = () => {
      setIsAdmin(localStorage.getItem("isAdminAuth") === "true");
      setIsUser(localStorage.getItem("isUserAuth") === "true");
    };
    window.addEventListener("auth-change", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("auth-change", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const navigationLinks = [
    { label: "Home", path: "/" },
    ...(isAdmin
      ? [
          { label: "Category", path: "/admincategory" },
          { label: "Menu", path: "/adminmenu" },
          { label: "DinnTable", path: "/admintable" },
          { label: "Orders", path: "/adminorders" },
          { label: "SalesAnalysis", path: "/adminanalysis" },
          { label: "Feedbacks", path: "/adminfeedback" },
        ]
      : [
          { label: "Menu", path: "/menu" },
          ...(localStorage.getItem("table_id") ? [{ label: "Cart", path: "/cart" }] : []),
          { label: "Book a Table", path: "/tablebooking" },
          { label: "Feedbacks", path: "/adminfeedback" },
        ]),
    { label: "About", path: "/aboutus" },
  ];

  const desktopLinkStyle = (path) => ({
    m: 1,
    px: 1,
    py: 0.75,
    borderRadius: 1,
    color: location.pathname === path ? "#EBF2D5" : textColor,
    backgroundColor: location.pathname === path ? textColor : "transparent",
    textDecoration: "none",
    transition: "background-color 160ms ease, color 160ms ease",
    "&:hover": { backgroundColor: textColor, color: "#EBF2D5" },
  });

  const handleDrawerNavigate = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleAuthButton = () => {
    if (isAdmin || isUser) {
      localStorage.removeItem("isAdminAuth");
      localStorage.removeItem("isUserAuth");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_name");
      notifyAuthChange();
      navigate("/", { replace: true });
      setDrawerOpen(false);
      return;
    }
    navigate("/signin");
    setDrawerOpen(false);
  };

  const authButtonLabel = isAdmin || isUser ? "LogOut" : "Login/SignUp";

  return (
    <Box sx={{ marginBottom: 0, flexGrow: 1 }}>
      <AppBar position="static" sx={{ backgroundColor: "#EBF2D5", boxShadow: "none" }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
            <img src={Automn_logo} alt="Automn Logo" style={{ width: 40, height: 40, marginRight: 8 }} />
            <Typography
              variant="h4"
              component="div"
              sx={{ color: textColor, fontFamily: "Dancing Script" }}
              className="rest-name"
              onClick={() => navigate("/")}
            >
              Automn
            </Typography>
          </Box>

          {isSmallScreen ? (
            <Box
              className="menu-icon"
              onClick={() => setDrawerOpen(true)}
              sx={{ cursor: "pointer", fontSize: 24 }}
              aria-label="Open navigation menu"
              role="button"
              tabIndex={0}
            >
              &#9776;
            </Box>
          ) : (
            <Box className="navbar" sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
              {navigationLinks.map(({ label, path }) => (
                <Link
                  key={path}
                  component={RouterLink}
                  to={path}
                  color="inherit"
                  aria-current={location.pathname === path ? "page" : undefined}
                  sx={desktopLinkStyle(path)}
                >
                  {label}
                </Link>
              ))}
            </Box>
          )}

          {!isSmallScreen && (
            <ButtonComponent color={"tertiary"} message={authButtonLabel} func={handleAuthButton} />
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ width: "70vw" }}>
        <List className="navigation-drawer">
          {navigationLinks.map(({ label, path }) => (
            <ListItemButton
              key={path}
              selected={location.pathname === path}
              onClick={() => handleDrawerNavigate(path)}
              aria-current={location.pathname === path ? "page" : undefined}
            >
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
          <ListItemButton onClick={handleAuthButton}>
            <ListItemText primary={authButtonLabel} />
          </ListItemButton>
        </List>
      </Drawer>
    </Box>
  );
}
