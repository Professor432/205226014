import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import { toast } from "react-toastify";
import { table as tableAxios, users } from "../AxiosCreate";
import { saveUserSession } from "../../auth";

const boxStyle = {
  width: "90%",
  maxWidth: "380px",
  padding: "20px",
  backgroundColor: "#f0f4d4",
  border: "2px solid #982c2c",
  margin: "40px auto 50px",
};

const inputStyle = {
  backgroundColor: "white",
  width: "100%",
  marginBottom: "15px",
  border: "1px solid #982c2c",
  borderRadius: "4px",
  padding: "10px",
  boxSizing: "border-box",
};

export default function UserSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await users.post("/login", {
        user_email: email.trim().toLowerCase(),
        password,
      });
      saveUserSession(response.data);

      try {
        const bookingResponse = await tableAxios.get("/mine");
        const booking = bookingResponse.data.data;
        if (booking) {
          localStorage.setItem("table_id", booking.table_id);
          localStorage.setItem("table_capacity", booking.capacity);
          localStorage.setItem("table_user_email", response.data.user.user_email);
        } else {
          localStorage.removeItem("table_id");
          localStorage.removeItem("table_capacity");
          localStorage.removeItem("table_user_email");
        }
      } catch (bookingError) {
        console.error("Unable to synchronize the current table booking:", bookingError);
        toast.error("Logged in, but your current table booking could not be loaded.");
      }

      toast.success("Login successful.");
      navigate("/");
    } catch (error) {
      const message = error.response && error.response.data
        ? error.response.data.message
        : "Unable to connect to the server. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
      <Typography variant="h4" align="center" sx={{ color: "#982c2c", mt: 5 }}>
        User Login
      </Typography>
      <form style={boxStyle} onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email address"
          autoComplete="email"
          required
          style={inputStyle}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          required
          style={inputStyle}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ backgroundColor: "#982c2c", borderRadius: 0 }}>
              {loading ? "Signing in..." : "Login"}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button type="button" variant="contained" fullWidth onClick={() => navigate("/")} sx={{ backgroundColor: "#982c2c", borderRadius: 0 }}>
              Back
            </Button>
          </Grid>
        </Grid>
        <Typography align="center" sx={{ mt: 3 }}>
          New user? <RouterLink to="/userlogin">Create an account</RouterLink>
        </Typography>
        <Typography align="center" sx={{ mt: 1 }}>
          Admin? <RouterLink to="/adminlogin">Admin login</RouterLink>
        </Typography>
      </form>
    </div>
  );
}
