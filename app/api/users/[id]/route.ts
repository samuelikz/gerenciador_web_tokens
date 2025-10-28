import { NextRequest, NextResponse } from 'next/server';

interface ContextProps {
  params: {
    id: string; 
  };
}

export async function PATCH(
  req: NextRequest, 
  context: ContextProps 
) {
  const { id } = context.params; 

  try {
    const data = await req.json();
    console.log(`Atualizando utilizador ${id} com dados:`, data);
    
    return NextResponse.json({ success: true, data: { userId: id, ...data } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ 
        success: false, 
        error: { 
            message: "Falha ao processar a requisição." 
        } 
    }, { status: 500 });
  }
}

