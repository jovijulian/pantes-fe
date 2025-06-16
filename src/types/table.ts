import { ColumnDef } from "@tanstack/react-table";

export type TableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData>[];
  isLoading: boolean;
};
