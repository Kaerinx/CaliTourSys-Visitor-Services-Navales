import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { MapDiscovery } from "./pages/MapDiscovery";
import { OTOPProducts } from "./pages/OTOPProducts";
import { ProductDetail } from "./pages/ProductDetail";
import { Events } from "./pages/Events";
import { Museum } from "./pages/Museum";
import { ComponentNotes } from "./pages/ComponentNotes";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "discover", Component: MapDiscovery },
      { path: "otop-products", Component: OTOPProducts },
      { path: "otop-products/:id", Component: ProductDetail },
      { path: "events", Component: Events },
      { path: "museum", Component: Museum },
      { path: "components", Component: ComponentNotes },
    ],
  },
]);