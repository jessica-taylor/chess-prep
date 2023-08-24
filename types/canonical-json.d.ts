declare module "canonical-json" {
  /**
   * Produces a canonical JSON string.
   * 
   * @param value The value to convert to canonical JSON.
   * @param replacer A function that alters the behavior of the stringification process, or an array of String and Number objects that serve as a whitelist for selecting/filtering the properties of the value object to be included in the JSON string.
   * @param space A String or Number object that's used to insert white space into the output JSON string for readability purposes.
   */
  function canonicalJson(value: any, replacer?: (key: string, value: any) => any | (number | string)[], space?: string | number): string;

  export = canonicalJson;
}
