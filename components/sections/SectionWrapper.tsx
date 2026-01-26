// components/sections/SectionWrapper.tsx
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

type SectionWrapperProps = {
  panelId: string;
  expanded: string | false;
  onChange: (panel: string) => void;
  config: any;
  isSmall: boolean;
  children: React.ReactNode;
};

export function SectionWrapper({
  panelId,
  expanded,
  onChange,
  config,
  isSmall,
  children,
}: SectionWrapperProps) {
  const isExpanded = expanded === panelId;

  return (
    <Accordion
      expanded={isExpanded}
    //   onChange={onChange(panelId)}
      elevation={0}
      sx={{
        borderBottom: "1px solid #e2e8f0",
        "&::before": { display: "none" },
        "&.Mui-expanded": {
          bgcolor: `${config.color}08`,
        },
      }}
    >
      <AccordionSummary
        expandIcon={
          <ExpandMoreIcon
            sx={{
              color: isExpanded ? config.color : "inherit",
              fontSize: { xs: 20, sm: 24 },
            }}
          />
        }
        sx={{ px: { xs: 2, sm: 3 }, py: 1 }}
      >
        {/* <AccordionHeader
          config={config}
          isExpanded={isExpanded}
          isSmall={isSmall}
        /> */}
      </AccordionSummary>

      <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 4 } }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}
