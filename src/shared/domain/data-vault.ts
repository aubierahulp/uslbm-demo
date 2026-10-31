/** Encrypted local storage. Data can be read only while the vault is open. */
export interface DataVault {
  open(): Promise<void>;
  close(): Promise<void>;
}
