import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl, action } = body
    
    // Use correct model name: gemini-pro (for text) or gemini-1.5-pro
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    if (action === 'suggest-bg') {
      const prompt = `You are a professional product photographer. Suggest ONE professional background color or setting for a product image for an e-commerce website. Keep response under 100 characters.`
      const result = await model.generateContent(prompt)
      const suggestion = result.response.text()
      
      return NextResponse.json({ 
        success: true, 
        suggestion: suggestion 
      })
    }
    
    else if (action === 'enhance') {
      const prompt = `You are a professional image editor. Give 3 short tips to enhance a product image for e-commerce. Keep under 150 characters.`
      const result = await model.generateContent(prompt)
      const tips = result.response.text()
      
      return NextResponse.json({ 
        success: true, 
        suggestion: tips,
        image: imageUrl
      })
    }
    
    else if (action === 'remove-bg') {
      // Gemini doesn't directly remove backgrounds
      // Use the remove-bg API instead
      return NextResponse.json({ 
        success: false, 
        error: 'Please use the Remove BG button for background removal',
        useRemoveBgApi: true
      })
    }
    
    else {
      return NextResponse.json({ success: false, error: 'Unknown action' })
    }
    
  } catch (error) {
    console.error('Gemini AI error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 200 })
  }
}