import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { table as tableAxios } from "../AxiosCreate";
import { toast } from "react-toastify";

const LeaveTable = ({ canLeave = false }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!canLeave || !localStorage.getItem("table_id")) {
    return null;
  }

  const vacantTable = async () => {
    const tableId = localStorage.getItem("table_id");
    let destination = null;
    setLoading(true);
    try {
      await tableAxios.post(`/${tableId}/release`);
      localStorage.removeItem("table_id");
      localStorage.removeItem("table_capacity");
      localStorage.removeItem("table_user_email");
      toast.success("Table released. Please leave us a review.");
      destination = "/feedback";
    } catch (error) {
      console.error("Unable to release table:", error);
      toast.error(error.response?.data?.message || "Unable to release the table. Please try again.");
      if (error.response?.status === 409) {
        destination = "/cart";
      }
    } finally {
      setLoading(false);
      if (destination) {
        setOpen(false);
      }
    }
    if (destination) {
      navigate(destination);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Leave table
      </button>
      <Dialog
        open={open}
        onClose={() => {
          if (!loading) setOpen(false);
        }}
        aria-labelledby="leave-table-title"
        aria-describedby="leave-table-description"
      >
        <Box sx={{ p: 4, maxWidth: 420, textAlign: "center", bgcolor: "#f0f4d4" }}>
          <Typography id="leave-table-title" variant="h5" sx={{ color: "#942D2D", mb: 2 }}>
            Leave this table?
          </Typography>
          <Typography id="leave-table-description" sx={{ mb: 3 }}>
            Your orders are paid. You can release the table now or continue ordering.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            <button className="leave-table-dialog-button" type="button" onClick={vacantTable} disabled={loading}>
              {loading ? "Releasing..." : "Yes, leave table"}
            </button>
            <button
              className="leave-table-dialog-button"
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/menu");
              }}
              disabled={loading}
            >
              Continue ordering
            </button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

export default LeaveTable;
