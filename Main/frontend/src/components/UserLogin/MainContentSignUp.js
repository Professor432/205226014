import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import { toast } from "react-toastify";
import { users } from "../AxiosCreate";
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

export default function UserSignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await users.post("/register", {
        user_name: name.trim(),
        user_email: email.trim().toLowerCase(),
        password,
      });
      saveUserSession(response.data);
      toast.success("Account created. You are now signed in.");
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
        Create Your Account
      </Typography>
      <form style={boxStyle} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          autoComplete="name"
          maxLength={80}
          required
          style={inputStyle}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
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
          placeholder="Password (at least 8 characters)"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          style={inputStyle}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ backgroundColor: "#982c2c", borderRadius: 0 }}>
              {loading ? "Creating..." : "Sign up"}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button type="button" variant="contained" fullWidth onClick={() => navigate("/")} sx={{ backgroundColor: "#982c2c", borderRadius: 0 }}>
              Back
            </Button>
          </Grid>
        </Grid>
        <Typography align="center" sx={{ mt: 3 }}>
          Already registered? <RouterLink to="/signin">Login</RouterLink>
        </Typography>
        <Typography align="center" sx={{ mt: 1 }}>
          Admin? <RouterLink to="/adminlogin">Admin login</RouterLink>
        </Typography>
      </form>
    </div>
  );
}
