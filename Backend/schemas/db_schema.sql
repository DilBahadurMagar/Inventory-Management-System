-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.assets (
  asset_id integer NOT NULL DEFAULT nextval('assets_asset_id_seq'::regclass),
  item_id integer,
  serial_number character varying UNIQUE,
  location_id integer,
  supplier_id integer,
  status character varying DEFAULT 'In Stock'::character varying,
  purchase_date date,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT assets_pkey PRIMARY KEY (asset_id),
  CONSTRAINT assets_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id),
  CONSTRAINT assets_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(location_id),
  CONSTRAINT assets_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(supplier_id)
);
CREATE TABLE public.categories (
  category_id integer NOT NULL DEFAULT nextval('categories_category_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  CONSTRAINT categories_pkey PRIMARY KEY (category_id)
);
CREATE TABLE public.inventory (
  inventory_id integer NOT NULL DEFAULT nextval('inventory_inventory_id_seq'::regclass),
  item_id integer,
  location_id integer,
  quantity_on_hand integer NOT NULL DEFAULT 0,
  last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT inventory_pkey PRIMARY KEY (inventory_id),
  CONSTRAINT inventory_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id),
  CONSTRAINT inventory_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(location_id)
);
CREATE TABLE public.items (
  item_id integer NOT NULL DEFAULT nextval('items_item_id_seq'::regclass),
  category_id integer,
  name character varying NOT NULL,
  sku character varying NOT NULL UNIQUE,
  reorder_level integer DEFAULT 10,
  unit_price numeric DEFAULT 0.00,
  CONSTRAINT items_pkey PRIMARY KEY (item_id),
  CONSTRAINT items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id)
);
CREATE TABLE public.locations (
  location_id integer NOT NULL DEFAULT nextval('locations_location_id_seq'::regclass),
  name character varying NOT NULL,
  address text,
  is_active boolean DEFAULT true,
  CONSTRAINT locations_pkey PRIMARY KEY (location_id)
);
CREATE TABLE public.roles (
  role_id integer NOT NULL DEFAULT nextval('roles_role_id_seq'::regclass),
  role_name character varying NOT NULL UNIQUE,
  description text,
  CONSTRAINT roles_pkey PRIMARY KEY (role_id)
);
CREATE TABLE public.suppliers (
  supplier_id integer NOT NULL DEFAULT nextval('suppliers_supplier_id_seq'::regclass),
  company_name character varying NOT NULL,
  contact_name character varying,
  email character varying,
  phone character varying,
  CONSTRAINT suppliers_pkey PRIMARY KEY (supplier_id)
);
CREATE TABLE public.transactions (
  transaction_id integer NOT NULL DEFAULT nextval('transactions_transaction_id_seq'::regclass),
  item_id integer,
  location_id integer,
  user_id integer,
  transaction_type character varying NOT NULL,
  quantity integer NOT NULL,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id),
  CONSTRAINT transactions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id),
  CONSTRAINT transactions_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(location_id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.users (
  user_id integer NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
  role_id integer,
  username character varying NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name character varying,
  is_active boolean DEFAULT true,
  last_login timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id)
);