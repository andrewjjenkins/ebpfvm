import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface HeaderProps {
  onDrawerToggle: () => void;
}

export default function Header(props: HeaderProps) {
    return (
        <React.Fragment>
            <Box>
                <Typography variant="body2" color="text.secondary" align="left">
                    Header text here
                </Typography>
            </Box>
        </React.Fragment>
    )
}
