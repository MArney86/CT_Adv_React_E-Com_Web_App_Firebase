export interface User {
  uid: string;
  email: string | null;
  username: string | null;
  created: string; // ISO string format for serialization
  isActive: boolean;
  accountDeleted: {
    isDeleted: boolean;
    deletionDate: string | null; // ISO string format for serialization
  };
  orders: number[];
  shippingInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    physicalAddress: string;
    city: string;
    state: string;
    zipCode: string;
  };
}