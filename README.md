# V-kya: AI-Powered Content Generator

V-kya is a powerful AI-driven content generation tool built using Next.js and the OpenAI API. It allows users to generate, search, translate, and save various content formats.

## Features and Functionality

* **Content Generation:**  Generate text content based on user-provided prompts.  The application uses the `gpt-3.5-turbo` model (or `gpt-4o-mini` in `src/components/ContentGenerator.tsx`) and allows for customization of parameters like temperature and max tokens.  See `src/components/ContentGenerator.tsx` for details on API request configuration.
* **Content Search:** Search for relevant content ideas based on a given search query. Uses AI to provide related suggestions.
* **Content Translation:** Translate generated content into different languages. Supported languages are defined in `src/components/ContentGenerator.tsx` (`LANGUAGES` constant).
* **Prompt Saving:** Save prompts for later use. Prompts are stored in local storage.
* **Multiple API Keys:** Supports multiple OpenAI API keys for improved resilience against rate limits. Keys are managed in environment variables (`NEXT_PUBLIC_API_KEY_OPEN_AI_1`, etc.).  The application cycles through available keys if rate limits are encountered (see `makeOpenAIRequest` function in `src/components/ContentGenerator.tsx` and `src/components/ContentGenerator copy.tsx`).
* **Multiple Export Options:** Export generated content as a Word document (.doc), PDF (.pdf), or PNG image (.png).
* **Dark Mode Support:**  Includes a built-in dark mode toggle. Uses `next-themes` package for theme management.
* **Responsive Design:** Designed to be responsive and work on various screen sizes.

## Technology Stack

* **Next.js:** React framework for building the user interface.
* **OpenAI API:**  AI model for content generation and translation.
* **Lucide React:** Icon library.
* **Class Variance Authority (cva):**  For creating styled components.
* **Tailwind CSS:** Utility-first CSS framework.
* **`next-themes`:** For dark mode support.
* **`@radix-ui/react-select` and `@radix-ui/react-tabs` and `@radix-ui/react-toast`:**  For UI components.
* **`file-saver`:**  For saving generated content as various file types.
* **`html2canvas` and `jspdf`:** For exporting generated content to PDF.


## Prerequisites

* Node.js and npm (or yarn)
* An OpenAI API key.  Set your API keys as environment variables (e.g., `NEXT_PUBLIC_API_KEY_OPEN_AI_1`, `NEXT_PUBLIC_API_KEY_OPEN_AI_2`, etc.).

## Installation Instructions

1. Clone the repository: `git clone https://github.com/ShiwangPande/V-kya.git`
2. Navigate to the project directory: `cd V-kya`
3. Install dependencies: `npm install` or `yarn install`
4. Set your OpenAI API keys as environment variables.

## Usage Guide

1. Run the development server: `npm run dev` or `yarn dev`
2. Open your browser and go to `http://localhost:3000`.
3. Enter your prompt in the text area and click "Generate Content."
4. Use the options to save, translate or export your content.

## API Documentation

The application primarily uses the OpenAI API's chat completion endpoint. Refer to the OpenAI API documentation for details on available parameters: [https://platform.openai.com/docs/api-reference/completions](https://platform.openai.com/docs/api-reference/completions)

## Contributing Guidelines

Contributions are welcome! Please open an issue or submit a pull request.

## License Information

License information not specified.


## Contact/Support Information

No contact information provided.
