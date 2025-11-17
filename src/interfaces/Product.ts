export type Product = {
    pid: number; //product id
    title: string; //name of the product
    price: number; //price of the product
    description: string; //description of the product
    category: string; //category of the product
    image: string; //image URL of the product
    isActive: boolean; //whether the product is active
    isDiscontinued: boolean; //whether the product is discontinued
    removed: {
        isRemoved: boolean;
        removedDate: string | null;
    };
    rating: {
        rate: number; //average rating of the product
        count: number; //number of ratings
    };
    creatorUid: string; //user id of the product creator
    comment: string; //additional comments about the product
};