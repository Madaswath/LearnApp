# Advanced Deep Learning

## Transformers and Attention Mechanism

The Transformer architecture (Vaswani et al., 2017) replaced RNNs with self-attention, enabling massive parallelisation.

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model: int, num_heads: int, dropout: float = 0.1):
        super().__init__()
        assert d_model % num_heads == 0
        self.d_k = d_model // num_heads
        self.num_heads = num_heads

        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)
        self.dropout = nn.Dropout(dropout)

    def forward(self, q, k, v, mask=None):
        B, T, D = q.shape
        Q = self.W_q(q).view(B, T, self.num_heads, self.d_k).transpose(1, 2)
        K = self.W_k(k).view(B, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_v(v).view(B, -1, self.num_heads, self.d_k).transpose(1, 2)

        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)

        weights = self.dropout(F.softmax(scores, dim=-1))
        out = torch.matmul(weights, V)
        out = out.transpose(1, 2).contiguous().view(B, T, D)
        return self.W_o(out)
```

## Diffusion Models

Diffusion models learn to denoise data, enabling photo-realistic image generation (DALL-E 2, Stable Diffusion).

```python
import torch

class DiffusionScheduler:
    def __init__(self, num_timesteps=1000, beta_start=1e-4, beta_end=0.02):
        self.betas = torch.linspace(beta_start, beta_end, num_timesteps)
        self.alphas = 1 - self.betas
        self.alpha_cumprod = torch.cumprod(self.alphas, dim=0)

    def add_noise(self, x_0, t, noise=None):
        if noise is None:
            noise = torch.randn_like(x_0)
        sqrt_alpha_cumprod = self.alpha_cumprod[t] ** 0.5
        sqrt_one_minus = (1 - self.alpha_cumprod[t]) ** 0.5
        return sqrt_alpha_cumprod * x_0 + sqrt_one_minus * noise, noise

    @torch.no_grad()
    def denoise_step(self, model, x_t, t):
        predicted_noise = model(x_t, t)
        alpha = self.alphas[t]
        alpha_hat = self.alpha_cumprod[t]
        beta = self.betas[t]
        x_prev = (1 / alpha**0.5) * (
            x_t - beta / (1 - alpha_hat)**0.5 * predicted_noise
        )
        if t > 0:
            x_prev += beta**0.5 * torch.randn_like(x_t)
        return x_prev
```

## Generative Adversarial Networks (GANs)

GANs pit a Generator against a Discriminator in a minimax game.

```python
class Generator(nn.Module):
    def __init__(self, latent_dim=100, img_channels=3, features=64):
        super().__init__()
        self.net = nn.Sequential(
            nn.ConvTranspose2d(latent_dim, features * 8, 4, 1, 0, bias=False),
            nn.BatchNorm2d(features * 8),
            nn.ReLU(True),
            nn.ConvTranspose2d(features * 8, features * 4, 4, 2, 1, bias=False),
            nn.BatchNorm2d(features * 4),
            nn.ReLU(True),
            nn.ConvTranspose2d(features * 4, features * 2, 4, 2, 1, bias=False),
            nn.BatchNorm2d(features * 2),
            nn.ReLU(True),
            nn.ConvTranspose2d(features * 2, features, 4, 2, 1, bias=False),
            nn.BatchNorm2d(features),
            nn.ReLU(True),
            nn.ConvTranspose2d(features, img_channels, 4, 2, 1, bias=False),
            nn.Tanh(),
        )

    def forward(self, z):
        return self.net(z)


class Discriminator(nn.Module):
    def __init__(self, img_channels=3, features=64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(img_channels, features, 4, 2, 1, bias=False),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Conv2d(features, features * 2, 4, 2, 1, bias=False),
            nn.BatchNorm2d(features * 2),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Conv2d(features * 2, 1, 4, 1, 0, bias=False),
            nn.Sigmoid(),
        )

    def forward(self, x):
        return self.net(x).view(-1)
```

## Reinforcement Learning with Neural Networks

Deep Q-Network (DQN) combines Q-learning with a neural network function approximator.

```python
import torch
import torch.nn as nn
from collections import deque, namedtuple
import random

Transition = namedtuple("Transition", ["state", "action", "reward", "next_state", "done"])

class DQN(nn.Module):
    def __init__(self, state_dim, action_dim, hidden=256):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, hidden),
            nn.ReLU(),
            nn.Linear(hidden, hidden),
            nn.ReLU(),
            nn.Linear(hidden, action_dim),
        )

    def forward(self, x):
        return self.net(x)


class ReplayBuffer:
    def __init__(self, capacity=50_000):
        self.buffer = deque(maxlen=capacity)

    def push(self, *args):
        self.buffer.append(Transition(*args))

    def sample(self, batch_size):
        return random.sample(self.buffer, batch_size)

    def __len__(self):
        return len(self.buffer)
```

## Multi-modal Models

Models that process multiple input types (text + image + audio).

```python
# CLIP-like image-text matching
class CLIPModel(nn.Module):
    def __init__(self, vision_encoder, text_encoder, embed_dim=512):
        super().__init__()
        self.vision_encoder = vision_encoder
        self.text_encoder = text_encoder
        self.vision_proj = nn.Linear(vision_encoder.output_dim, embed_dim)
        self.text_proj = nn.Linear(text_encoder.output_dim, embed_dim)
        self.logit_scale = nn.Parameter(torch.ones([]) * 2.6593)

    def forward(self, images, tokens):
        img_feat = F.normalize(self.vision_proj(self.vision_encoder(images)), dim=-1)
        txt_feat = F.normalize(self.text_proj(self.text_encoder(tokens)), dim=-1)

        scale = self.logit_scale.exp()
        logits = scale * img_feat @ txt_feat.T
        return logits
```

## Model Quantisation and Pruning

```python
import torch.quantization as quant

# Post-training static quantisation
model.eval()
model.qconfig = quant.get_default_qconfig("fbgemm")
quant.prepare(model, inplace=True)

# Calibrate with representative data
with torch.no_grad():
    for data, _ in calibration_loader:
        model(data)

quant.convert(model, inplace=True)
print(f"Quantised model size: {get_model_size(model):.2f} MB")


# Structured pruning with torch.nn.utils.prune
import torch.nn.utils.prune as prune

prune.ln_structured(model.conv1, name="weight", amount=0.3, n=2, dim=0)
prune.remove(model.conv1, "weight")   # make pruning permanent
```

## TensorRT Optimisation

```python
import tensorrt as trt
import torch
import torch_tensorrt

# Compile with Torch-TensorRT
trt_model = torch_tensorrt.compile(
    model,
    inputs=[torch_tensorrt.Input(
        min_shape=[1, 3, 224, 224],
        opt_shape=[8, 3, 224, 224],
        max_shape=[32, 3, 224, 224],
        dtype=torch.float16,
    )],
    enabled_precisions={torch.float16},
)
torch.jit.save(trt_model, "model_trt.ts")
```

## Neural Architecture Search (NAS)

```python
# Using Optuna for NAS
import optuna

def build_model(trial):
    n_layers = trial.suggest_int("n_layers", 2, 6)
    layers = []
    in_features = 784
    for i in range(n_layers):
        out_features = trial.suggest_int(f"units_{i}", 32, 512)
        layers += [nn.Linear(in_features, out_features), nn.ReLU()]
        dropout = trial.suggest_float(f"dropout_{i}", 0.0, 0.5)
        if dropout > 0.01:
            layers.append(nn.Dropout(dropout))
        in_features = out_features
    layers.append(nn.Linear(in_features, 10))
    return nn.Sequential(*layers)
```
