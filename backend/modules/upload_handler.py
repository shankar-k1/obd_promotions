import pandas as pd
import io

class UploadHandler:
    def __init__(self):
        pass

    def process_file(self, file_content, file_extension):
        """
        Parses uploaded file content and extracts MSISDNs.
        Supports .csv, .txt, .xlsx
        """
        msisdns = []
        ext = file_extension.lower()
        print(f"DEBUG: Processing file with extension: {ext}")
        try:
            if ext == '.csv':
                df = pd.read_csv(io.BytesIO(file_content))
                msisdns = self._extract_from_df(df)
            elif ext == '.txt':
                content = file_content.decode('utf-8')
                msisdns = [line.strip() for line in content.split('\n') if line.strip()]
            elif ext in ['.xlsx', '.xls']:
                print("DEBUG: Reading Excel file...")
                df = pd.read_excel(io.BytesIO(file_content), engine='openpyxl')
                msisdns = self._extract_from_df(df)
            
            print(f"DEBUG: Extracted {len(msisdns)} raw items from dataframe.")
            # Basic validation: remove duplicates and non-numeric chars
            # More robust: keep only digits
            msisdns = list(set([''.join(filter(str.isdigit, str(m))) for m in msisdns if str(m).strip()]))
            msisdns = [m for m in msisdns if m] # filter empty
            print(f"DEBUG: Validated {len(msisdns)} MSISDNs.")
            return msisdns
        except Exception as e:
            print(f"Error processing file in UploadHandler: {e}")
            return []

    def _extract_from_df(self, df):
        """Look for common phone number column names."""
        potential_cols = ['msisdn', 'phone', 'number', 'mobile', 'msisdn_list']
        for col in df.columns:
            if col.lower() in potential_cols:
                return df[col].astype(str).tolist()
        # If no matching column, take the first column
        return df.iloc[:, 0].astype(str).tolist()
