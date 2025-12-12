import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    // Extract video ID
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
    const videoId = videoIdMatch?.[1];

    if (!videoId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Link do YouTube inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try multiple download services
    const downloadUrl = await getDownloadUrl(videoId, format, quality);
    
    if (downloadUrl) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          downloadUrl: downloadUrl,
          videoId: videoId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Não foi possível obter o link de download. Tente outro vídeo.'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro ao processar. Tente novamente.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getDownloadUrl(videoId: string, format: string, quality: string): Promise<string | null> {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  // Try loader.to API
  try {
    console.log('Trying loader.to...');
    const loaderFormat = format === 'audio' ? 'mp3' : `mp4-${quality}`;
    
    // Step 1: Initialize download
    const initResponse = await fetch('https://loader.to/ajax/download.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `format=${loaderFormat}&url=${encodeURIComponent(youtubeUrl)}`,
    });
    
    const initData = await initResponse.json();
    console.log('Loader init response:', initData);
    
    if (initData.success && initData.id) {
      // Step 2: Poll for download link
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        
        const progressResponse = await fetch(`https://loader.to/ajax/progress.php?id=${initData.id}`);
        const progressData = await progressResponse.json();
        console.log('Progress:', progressData);
        
        if (progressData.success === 1 && progressData.download_url) {
          return progressData.download_url;
        }
        
        if (progressData.success === 0 && progressData.progress === 1000) {
          break; // Error
        }
      }
    }
  } catch (e) {
    console.error('loader.to error:', e);
  }

  // Try y2meta API
  try {
    console.log('Trying y2meta...');
    const y2metaInit = await fetch('https://www.y2meta.com/mates/analyzeV2/ajax', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `k_query=${encodeURIComponent(youtubeUrl)}&k_page=home&hl=en&q_auto=0`,
    });
    
    const y2metaData = await y2metaInit.json();
    console.log('y2meta response:', y2metaData);
    
    if (y2metaData.status === 'ok' && y2metaData.links) {
      const links = format === 'audio' ? y2metaData.links.mp3 : y2metaData.links.mp4;
      if (links) {
        const qualityKey = Object.keys(links).find(k => 
          format === 'audio' ? k.includes('128') || k.includes('mp3') : k.includes(quality)
        ) || Object.keys(links)[0];
        
        if (qualityKey && links[qualityKey]) {
          const convertResponse = await fetch('https://www.y2meta.com/mates/convertV2/index', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `vid=${y2metaData.vid}&k=${links[qualityKey].k}`,
          });
          
          const convertData = await convertResponse.json();
          console.log('y2meta convert response:', convertData);
          
          if (convertData.status === 'ok' && convertData.dlink) {
            return convertData.dlink;
          }
        }
      }
    }
  } catch (e) {
    console.error('y2meta error:', e);
  }

  // Fallback: Return direct service URL
  console.log('Using fallback direct URL');
  if (format === 'audio') {
    return `https://api.vevioz.com/api/button/mp3/${videoId}`;
  } else {
    return `https://api.vevioz.com/api/button/videos/${videoId}`;
  }
}
