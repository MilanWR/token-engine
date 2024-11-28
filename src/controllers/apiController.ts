import { Request, Response } from 'express';

export const analyzeSentiment = async (req: Request, res: Response) => {
  try {
    console.log('Analyzing sentiment for request:', req.body);
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Simple mock sentiment analysis
    const words = text.toLowerCase().split(' ');
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'horrible'];

    let score = 0;
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });

    const sentiment = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';

    res.json({
      sentiment,
      score,
      text,
      wordCount: words.length
    });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ error: 'Error analyzing sentiment' });
  }
};

export const countWords = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const words = text.trim().split(/\s+/);
    const uniqueWords = new Set(words.map(word => word.toLowerCase()));

    res.json({
      totalWords: words.length,
      uniqueWords: uniqueWords.size,
      text
    });
  } catch (error) {
    res.status(500).json({ error: 'Error counting words' });
  }
}; 