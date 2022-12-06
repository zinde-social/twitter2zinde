import React, { useState } from "react";
import {
  Backdrop,
  Box,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";

const Migrate = () => {
  const [isLoading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Loading account details..."
  );

  return (
    <>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <Box
          component="div"
          sx={{ mt: 1 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          <CircularProgress color="inherit" />
          <Typography component="h3" variant="h5">
            {loadingMessage}
          </Typography>
        </Box>
      </Backdrop>
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        Migrating Page
      </Box>
    </>
  );
};

export default Migrate;
