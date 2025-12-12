import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, format, quality } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing download request:', { url, format, quality });

    // Use cobalt.tools API for downloading
    const cobaltUrl = 'https://api.cobalt.tools/api/json';
    
    const requestBody: Record<string, unknown> = {
      url: url,
      vCodec: 'h264',
      vQuality: quality || '720',
      aFormat: 'mp3',
      filenamePattern: 'basic',
      isAudioOnly: format === 'audio',
    };

    console.log('Sending request to Cobalt API:', requestBody);

    const response = await fetch(cobaltUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('Cobalt API response:', data);

    if (data.status === 'error') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.text || 'Erro ao processar o vídeo'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (data.status === 'redirect' || data.status === 'stream') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          downloadUrl: data.url,
          filename: data.filename || 'video'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (data.status === 'picker') {
      // Multiple options available
      return new Response(
        JSON.stringify({ 
          success: true, 
          picker: true,
          options: data.picker
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Resposta inesperada do servidor'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing download:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
