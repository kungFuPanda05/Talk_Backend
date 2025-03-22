// xenovaWrapper.js
async function loadClassifier() {
    const { pipeline } = await import('@xenova/transformers');
    const classifier = await pipeline(
      'zero-shot-classification', 
      'Xenova/distilbart-mnli-12-9'  // <--- Xenova's own DistilBART MNLI model
    );
    return classifier;
  }
  
  module.exports = { loadClassifier };
  