declare module 'expo-sqlite' {
  export interface SQLError {
    message: string;
  }

  export interface SQLResultSet {
    insertId?: number;
    rowsAffected: number;
    rows: {
      length: number;
      item: (index: number) => any;
      _array: any[];
    };
  }

  export interface SQLTransaction {
    executeSql: (
      sqlStatement: string,
      args?: any[],
      success?: (transaction: SQLTransaction, resultSet: SQLResultSet) => void,
      error?: (transaction: SQLTransaction, error: SQLError) => void
    ) => void;
  }

  export interface Database {
    transaction: (
      callback: (transaction: SQLTransaction) => void,
      error?: (error: SQLError) => void,
      success?: () => void
    ) => void;
  }

  export function openDatabase(
    name: string,
    version?: string,
    description?: string,
    size?: number,
    callback?: (db: Database) => void
  ): Database;
} 