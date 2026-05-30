"""
BarberZap - Flame Graph Generator

Gerador de flame graphs para visualização de performance de código.
Suporta dados do profiler e gera SVG/JSON interativos.

Features:
- Coleta de stack frames
- Geração de SVG flame graph
- Export para arquivo
- Flame graph web UI interativa
- Suporte a py-spy para profiling
- Chrome DevTools format

Libraries:
- py-spy para Python profiling
- Chrome DevTools format
"""

import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from collections import defaultdict
from io import StringIO

try:
    from .backend_profiler import get_registry, ProfileData
except ImportError:
    from profiler.backend_profiler import get_registry, ProfileData


@dataclass
class StackFrame:
    """Representa um frame na stack"""
    name: str  # module.function
    value: float  # tempo em ms
    self_time: float  # tempo exclusivo (sem children)
    children: List['StackFrame'] = field(default_factory=list)
    depth: int = 0
    file: Optional[str] = None
    line: Optional[int] = None


@dataclass
class ChromeDevToolsFrame:
    """Frame no formato Chrome DevTools Profile"""
    name: str
    scriptId: str
    line: int
    column: int
    url: str
    functionId: int


@dataclass
class ChromeDevToolsSample:
    """Sample no formato Chrome DevTools Profile"""
    stackId: int
    timestamp: int  # microsegundos
    duration: int  # microsegundos


class FlameGraphGenerator:
    """Gerador de flame graphs"""
    
    def __init__(self):
        self.root_frame: Optional[StackFrame] = None
        self.chrome_timeline: List[Dict[str, Any]] = []
    
    async def generate_from_registry(
        self,
        registry,
        limit: int = 1000,
        top_functions: int = 20
    ) -> StackFrame:
        """Gera flame graph dos dados do registry
        
        Args:
            registry: ProfilerRegistry com dados
            limit: Limite de profiles a processar
            top_functions: Número de funções principais a incluir
            
        Returns:
            StackFrame raiz da árvore
        """
        # Buscar profiles do registry
        all_profiles = []
        
        # Para isso, precisamos do histórico de profiles
        # Como o registry tem apenas agregados, vamos criar uma estrutura
        # baseada nas stats
        
        stats = await registry.get_stats()
        
        # Criar frame raiz
        root = StackFrame(
            name="total",
            value=0,
            self_time=0,
            children=[],
            depth=0
        )
        
        # Processar cada função
        total_time = 0
        function_frames = {}
        
        for func_key, stat in stats.items():
            # Criar frame para cada função
            frame = StackFrame(
                name=func_key,
                value=stat['total_time_ms'],
                self_time=stat.get('avg_time_ms', 0),  # Aproximação
                children=[],
                depth=1,
                file=func_key.split(':')[0] if ':' in func_key else None
            )
            
            function_frames[func_key] = frame
            total_time += stat['total_time_ms']
        
        # Adicionar ao root como children
        # Ordenar por tempo total e pegar top N
        sorted_functions = sorted(
            function_frames.values(),
            key=lambda x: x.value,
            reverse=True
        )
        
        root.children = sorted_functions[:top_functions]
        root.value = total_time
        root.self_time = 0  # Root não tem self time
        
        self.root_frame = root
        
        return root
    
    async def generate_chrome_timeline(
        self,
        registry
    ) -> Dict[str, Any]:
        """Gera timeline no formato Chrome DevTools Profile
        
        Returns:
            Dict com o formato Chrome DevTools Profile
        """
        stats = await registry.get_stats()
        
        # Chrome DevTools Profile format
        # https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview
        
        timeline = {
            'nodes': [],
            'samples': [],
            'timeDeltas': []
        }
        
        node_id = 0
        node_map = {}  # frame name -> node id
        
        # Criar nodes para cada função
        for func_key, stat in stats.items():
            # Node
            module, func_name = func_key.split(':') if ':' in func_key else ('', func_key)
            
            node = {
                'id': node_id,
                'callFrame': {
                    'functionName': func_name,
                    'scriptId': str(node_id),
                    'url': f'file://{module}',
                    'lineNumber': 0,
                    'columnNumber': 0
                },
                'hitCount': stat['call_count'],
                'self': int(stat['avg_time_ms'] * 1000) if 'avg_time_ms' in stat else 0
            }
            
            timeline['nodes'].append(node)
            node_map[func_key] = node_id
            node_id += 1
        
        self.chrome_timeline = timeline
        
        return timeline
    
    def generate_svg_flamegraph(
        self,
        root_frame: Optional[StackFrame] = None,
        width: int = 1200,
        height_per_row: int = 20,
        colors: Optional[Dict[str, str]] = None
    ) -> str:
        """Gera flame graph em formato SVG
        
        Args:
            root_frame: Frame raiz (se None, usa self.root_frame)
            width: Largura total do SVG em pixels
            height_per_row: Altura de cada linha em pixels
            colors: Mapa personalizado de cores por função
            
        Returns:
            String SVG
        """
        if root_frame is None:
            root_frame = self.root_frame
        
        if root_frame is None:
            return "<!-- No profiling data available -->"
        
        # Calcular altura total
        max_depth = self._max_depth(root_frame)
        total_height = max_depth * height_per_row + 50  # +50 para header/footer
        
        # Cores padrão (warm colors for flame graph)
        if colors is None:
            colors = self._generate_color_map(root_frame)
        
        # Gerar SVG
        svg = StringIO()
        svg.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{total_height}">\n')
        
        # Header
        svg.write(f'''
        <style>
            .frame {{ cursor: pointer; }}
            .frame:hover {{ opacity: 0.8; }}
            text {{ font-family: monospace; font-size: 10px; }}
        </style>
        ''')
        
        # Render frames
        self._render_frame_svg(
            svg,
            root_frame,
            x=0,
            y=30,
            width=width,
            total_value=root_frame.value,
            height_per_row=height_per_row,
            colors=colors
        )
        
        # Footer
        svg.write(f'''
        <text x="10" y="{total_height - 10}">
            Generated: {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")} |
            Total Time: {root_frame.value:.2f}ms |
            Max Depth: {max_depth}
        </text>
        ''')
        
        svg.write('</svg>')
        
        return svg.getvalue()
    
    def _render_frame_svg(
        self,
        svg: StringIO,
        frame: StackFrame,
        x: float,
        y: float,
        width: float,
        total_value: float,
        height_per_row: int,
        colors: Dict[str, str]
    ):
        """Renderiza um frame no SVG recursivamente"""
        # Calcular largura proporcional
        frame_width = (frame.value / total_value) * width
        
        # Se muito pequeno, não renderizar
        if frame_width < 1:
            return
        
        # Color
        color = colors.get(frame.name, '#ff8c00')
        
        # Rectangle
        svg.write(f'''
        <g class="frame">
            <rect x="{x}" y="{y}" width="{frame_width}" height="{height_per_row - 1}"
                  fill="{color}" stroke="#ffffff" stroke-width="0.5">
            </rect>
            <text x="{x + 2}" y="{y + height_per_row - 5}" fill="white">
                {frame.name[:30]}
            </text>
            <title>{frame.name}: {frame.value:.2f}ms</title>
        </g>
        ''')
        
        # Render children
        child_x = x
        for child in sorted(frame.children, key=lambda c: c.value):
            self._render_frame_svg(
                svg,
                child,
                x=child_x,
                y=y + height_per_row,
                width=frame_width,
                total_value=frame.value,
                height_per_row=height_per_row,
                colors=colors
            )
            child_x += (child.value / frame.value) * frame_width
    
    def generate_json_flamegraph(
        self,
        root_frame: Optional[StackFrame] = None
    ) -> Dict[str, Any]:
        """Gera flame graph em formato JSON
        
        Args:
            root_frame: Frame raiz
            
        Returns:
            Dict no formato JSON flame graph
        """
        if root_frame is None:
            root_frame = self.root_frame
        
        if root_frame is None:
            return {}
        
        return self._frame_to_dict(root_frame)
    
    def _frame_to_dict(self, frame: StackFrame) -> Dict[str, Any]:
        """Converte frame para dict recursivamente"""
        return {
            'name': frame.name,
            'value': frame.value,
            'self_time': frame.self_time,
            'children': [self._frame_to_dict(child) for child in frame.children],
            'depth': frame.depth
        }
    
    def _max_depth(self, frame: StackFrame) -> int:
        """Calcula profundidade máxima recursivamente"""
        if not frame.children:
            return frame.depth
        
        return max(self._max_depth(child) for child in frame.children)
    
    def _generate_color_map(self, root_frame: StackFrame) -> Dict[str, str]:
        """Gera mapa de cores para os frames"""
        colors = {}
        
        # Cores quentes (flame graph)
        warm_colors = [
            '#ff8c00',  # dark orange
            '#ffa500',  # orange
            '#ff7f50',  # coral
            '#ff6347',  # tomato
            '#ff4500',  # orange red
            '#dc143c',  # crimson
            '#b22222',  # fire brick
            '#cd5c5c',  # indian red
        ]
        
        # Atribuir cores baseado no tipo de função
        def assign_colors(frame: StackFrame, color_index: int = 0) -> int:
            colors[frame.name] = warm_colors[color_index % len(warm_colors)]
            
            for child in frame.children:
                color_index = assign_colors(child, color_index + 1)
            
            return color_index
        
        assign_colors(root_frame)
        
        return colors
    
    async def export_to_file(
        self,
        format: str,
        output_file: str
    ):
        """Exporta flame graph para arquivo
        
        Args:
            format: 'json', 'svg', or 'chrome'
            output_file: Caminho do arquivo de saída
        """
        if format == 'json':
            data = self.generate_json_flamegraph()
            with open(output_file, 'w') as f:
                json.dump(data, f, indent=2)
        
        elif format == 'svg':
            svg_content = self.generate_svg_flamegraph()
            with open(output_file, 'w') as f:
                f.write(svg_content)
        
        elif format == 'chrome':
            data = self.chrome_timeline
            with open(output_file, 'w') as f:
                json.dump(data, f, indent=2)
        
        else:
            raise ValueError(f"Unknown format: {format}")


# ============================================

# Py-spy integration (optional)

async def capture_with_py_spy(
    pid: int,
    duration_seconds: int = 10,
    rate: int = 100,
    output_file: Optional[str] = None
) -> Dict[str, Any]:
    """
    Captura profiling com py-spy (se disponível)
    
    Args:
        pid: PID do processo Python
        duration_seconds: Duração da captura
        rate: Taxa de amostragem (samples por segundo)
        output_file: Arquivo para salvar JSON de saída
    
    Returns:
        Dict com dados do profiling
    """
    try:
        import subprocess
        import tempfile
        import os
        
        # Criar arquivo temporário para saída
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_file = f.name
        
        try:
            # Executar py-spy
            cmd = [
                'py-spy',
                'record',
                '-p', str(pid),
                '-o', temp_file,
                '-f', 'flamegraph',
                '-d', str(duration_seconds),
                '-r', str(rate),
                '--format', 'json'
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"py-spy failed: {stderr.decode()}")
            
            # Ler resultado
            with open(temp_file, 'r') as f:
                data = json.load(f)
            
            # salvar no output se fornecido
            if output_file:
                with open(output_file, 'w') as f:
                    json.dump(data, f, indent=2)
            
            return data
            
        finally:
            # Cleanup temp file
            if os.path.exists(temp_file):
                os.unlink(temp_file)
        
    except ImportError:
        raise Exception("py-spy not installed. Install with: pip install py-spy")
    except FileNotFoundError:
        raise Exception("py-spy not found in PATH")


async def generate_flamegraph() -> str:
    """
    Função helper para gerar flame graph do registry atual.
    
    Returns:
        SVG string do flame graph
    """
    registry = get_registry()
    generator = FlameGraphGenerator()
    
    # Gerar dos dados do registry
    root_frame = await generator.generate_from_registry(registry)
    
    # Gerar SVG
    svg = generator.generate_svg_flamegraph(root_frame)
    
    return svg


async def generate_flamegraph_json() -> Dict[str, Any]:
    """
    Função helper para gerar flame graph JSON do registry atual.
    
    Returns:
        Dict com dados do flame graph
    """
    registry = get_registry()
    generator = FlameGraphGenerator()
    
    # Gerar dos dados do registry
    root_frame = await generator.generate_from_registry(registry)
    
    # Gerar JSON
    return generator.generate_json_flamegraph(root_frame)


if __name__ == '__main__':
    # Test generation
    async def test():
        from backend_profiler import ProfilerRegistry, ProfileData
        
        # Create test registry
        registry = ProfilerRegistry()
        
        # Add test profile
        profile = ProfileData(
            function_name="test_func",
            module="test_module",
            file="test.py",
            line=10,
            execution_time_ms=100,
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc),
            memory_before_mb=10,
            memory_after_mb=15,
            memory_delta_mb=5,
            cpu_before_ms=0,
            cpu_after_ms=10,
            cpu_delta_ms=10
        )
        
        await registry.add_profile(profile)
        
        # Generate flamegraph
        svg = await generate_flamegraph()
        print("Flamegraph SVG generated!")
        print(svg[:500])
    
    asyncio.run(test())
