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

    // Use the new Cobalt API v10
    const cobaltUrl = 'https://api.cobalt.tools/';
    
    const requestBody = {
      url: url,
      videoQuality: quality || '720',
      audioFormat: 'mp3',
      downloadMode: format === 'audio' ? 'audio' : 'auto',
    };

    console.log('Sending request to Cobalt API v10:', requestBody);

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

    // Handle different response statuses
    if (data.status === 'error') {
      console.error('Cobalt error:', data);
      
      // Fallback to alternative download method
      return await fallbackDownload(url, format, quality, corsHeaders);
    }

    if (data.status === 'tunnel' || data.status === 'redirect') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          downloadUrl: data.url,
          filename: data.filename || 'download'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (data.status === 'picker') {
      // Multiple options available
      const firstOption = data.picker?.[0];
      if (firstOption?.url) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            downloadUrl: firstOption.url,
            picker: true,
            options: data.picker
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If cobalt fails, use fallback
    return await fallbackDownload(url, format, quality, corsHeaders);

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

// Fallback using y2mate-style service
async function fallbackDownload(url: string, format: string, quality: string, corsHeaders: Record<string, string>) {
  console.log('Using fallback download method');
  
  try {
    // Extract video ID
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
    const videoId = videoIdMatch?.[1];
    
    if (!videoId) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID do vídeo não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use ssyoutube API as fallback
    const apiUrl = `https://api.ssyoutube.com/v2/download?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Fallback API response:', data);
      
      if (data.url) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            downloadUrl: data.url,
            filename: data.title || 'video'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If all APIs fail, return a redirect to external service
    const externalUrl = format === 'audio' 
      ? `https://www.y2mate.com/youtube-mp3/${videoId}`
      : `https://www.y2mate.com/youtube/${videoId}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        downloadUrl: externalUrl,
        external: true,
        message: 'Redirecionando para serviço externo'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fallback error:', error);
    
    // Extract video ID for external redirect
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
    const videoId = videoIdMatch?.[1] || '';
    
    const externalUrl = format === 'audio' 
      ? `https://www.y2mate.com/youtube-mp3/${videoId}`
      : `https://www.y2mate.com/youtube/${videoId}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        downloadUrl: externalUrl,
        external: true,
        message: 'Redirecionando para serviço externo'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
