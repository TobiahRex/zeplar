import { createBrowserRouter } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Study from "@/pages/Study";
import SessionSummary from "@/pages/SessionSummary";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
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
