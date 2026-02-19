import os
from dotenv import load_dotenv

load_dotenv()

class OBDPromptAgent:
    def __init__(self):
        self.api_key = os.getenv("LLM_API_KEY")
        self.model = None

        if self.api_key and self.api_key != "your_gemini_api_key_here":
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                self.model = "gemini-2.0-flash"
            except ImportError:
                # Fallback to deprecated library if new one not installed
                try:
                    import google.generativeai as genai_legacy
                    genai_legacy.configure(api_key=self.api_key)
                    self.model_legacy = genai_legacy.GenerativeModel('gemini-1.5-flash')
                    self.model = "legacy"
                except ImportError:
                    pass

    def _generate(self, prompt):
        """Unified generation method supporting both SDK versions."""
        if self.model == "legacy":
            response = self.model_legacy.generate_content(prompt)
            return response.text
        elif self.model:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            return response.text
        return None

    def generate_prompts(self, context):
        """Generates promotional OBD scripts based on the provided context."""
        result = self._generate(f"""
        Design 3 variations of an OBD (Outbound Dialer) promotional script for the following context:
        {context}

        Requirements:
        1. Keep them short (under 30 seconds of speech).
        2. Make them engaging and clear.
        3. Format as a JSON list of strings.
        """)
        if result:
            return result
        return ["Sample Prompt: Welcome to our special promotion! (API Key missing or invalid)"]

    def generate_flow_mermaid(self, context):
        """Generates a Mermaid flow diagram for the OBD campaign."""
        result = self._generate(f"""
        Create a Mermaid.js flow diagram for an OBD campaign based on this context:
        {context}
        Include nodes for Call Start, Promo Play, Key Press (1 to subscribe, 2 to repeat), and End.
        Output ONLY the raw mermaid code, no markdown fences.
        """)
        if result:
            return self._clean_mermaid(result)
        return "graph TD\n    A[Start] --> B[Play Promo]\n    B --> C[User Action]"

    def generate_flow_from_doc(self, doc_text):
        """Analyzes a product document or rough prompt to create a complete campaign flow."""
        result = self._generate(f"""
        You are an OBD (Outbound Dialer) campaign designer. Analyze the following product/campaign description and create a comprehensive call flow diagram.

        Product/Campaign Description:
        ---
        {doc_text}
        ---

        Requirements:
        1. Identify all interactive nodes (e.g., Press 1 to subscribe, Press 2 to hear again, Press 9 to opt-out).
        2. Include retry/timeout logic.
        3. Output a valid Mermaid.js graph using "graph TD" syntax.
        4. Use professional, concise labels for each node.
        5. Output ONLY the raw mermaid code — no markdown fences, no explanation.

        Example format:
        graph TD
            A[Call Start] --> B[Play Promo Message]
            B --> C{{Key Press?}}
            C -- 1 --> D[Subscribe User]
            C -- 2 --> B
            C -- Timeout --> E[End Call]
            D --> F[Thank You Message]
            F --> E
        """)
        if result:
            return self._clean_mermaid(result)
        return "graph TD\n    A[Start] --> B[Play Promo]\n    B --> C[User Action]"

    def _clean_mermaid(self, text):
        """Strips markdown fences from mermaid output."""
        text = text.strip()
        if "```mermaid" in text:
            text = text.split("```mermaid")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return text
