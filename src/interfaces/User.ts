import type Carts from "./Carts";

export interface User {
  id: string;
  email: string;
  username: string;
  carts: Carts[];
}