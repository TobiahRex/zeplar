import { createBrowserRouter } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import PatternSelection from "@/pages/PatternSelection";
import Study from "@/pages/Study";
import SessionSummary from "@/pages/SessionSummary";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/select",
    element: <PatternSelection />,
  },
  {
    path: "/study",
    element: <Study />,
  },
  {
    path: "/study/summary",
    element: <SessionSummary />,
  },
]);
