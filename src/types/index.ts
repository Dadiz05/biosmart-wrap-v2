export type Product = {
  name: string;
  supplier: string;
  packDate: string;
};

export type AIResult = {
  ph: number;
  color: "purple" | "blue" | "green" | "yellow";
  status: "fresh" | "warning" | "spoiled";
};

export type AppStatus = "idle" | "loading" | "done" | "error";