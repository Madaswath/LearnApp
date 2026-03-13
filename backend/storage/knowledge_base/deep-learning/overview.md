# Deep Learning Fundamentals

## What are Neural Networks?

A neural network is a computational model loosely inspired by the brain. It consists of layers of interconnected nodes (neurons). Each connection carries a weight that is adjusted during training. By stacking many layers, a deep neural network (DNN) can learn hierarchical representations of data.

## Neurons and Activation Functions

A neuron computes: `output = activation(weights · inputs + bias)`

```python
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def relu(z):
    return np.maximum(0, z)

def tanh(z):
    return np.tanh(z)

# Modern activations
def leaky_relu(z, alpha=0.01):
    return np.where(z > 0, z, alpha * z)

def gelu(z):
    return 0.5 * z * (1 + np.tanh(np.sqrt(2 / np.pi) * (z + 0.044715 * z**3)))
```

| Activation | Range | Use Case |
|-----------|-------|----------|
| Sigmoid | (0, 1) | Binary output, old-style hidden layers |
| Tanh | (-1, 1) | Normalised hidden layers |
| ReLU | [0, ∞) | Default hidden layers |
| Leaky ReLU | (-∞, ∞) | Dying ReLU fix |
| GELU | (-∞, ∞) | Transformers (BERT, GPT) |
| Softmax | (0, 1) | Multi-class output |

## Backpropagation and Gradient Descent

```python
import torch
import torch.nn as nn

# PyTorch computes gradients automatically
x = torch.tensor([2.0], requires_grad=True)
y = x ** 3 + 2 * x

y.backward()          # compute dy/dx
print(x.grad)         # tensor([14.])  (3x² + 2 at x=2)

# Optimizers
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)

for epoch in range(100):
    optimizer.zero_grad()
    output = model(X_batch)
    loss = criterion(output, y_batch)
    loss.backward()
    optimizer.step()
```

### Gradient Descent Variants

| Algorithm | Update Rule | Best For |
|-----------|-------------|----------|
| SGD | w -= lr * grad | Baseline, momentum needed |
| Momentum | w -= lr * (β·v + grad) | Faster convergence |
| RMSprop | Adaptive per-param lr | RNNs |
| Adam | Momentum + RMSprop | Default choice |
| AdamW | Adam + decoupled weight decay | Transformers |

## Convolutional Neural Networks (CNNs)

```python
import torch.nn as nn

class CNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),

            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),

            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
        )
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d((4, 4)),
            nn.Flatten(),
            nn.Linear(128 * 16, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        return self.classifier(self.features(x))
```

## Recurrent Neural Networks (RNNs) and LSTMs

```python
class LSTMModel(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, output_size):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size, hidden_size, num_layers,
            batch_first=True, dropout=0.3
        )
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        out, (h_n, c_n) = self.lstm(x)
        return self.fc(out[:, -1, :])  # use last time step
```

## Transfer Learning

```python
import torchvision.models as models

# Load pretrained ResNet-50
resnet = models.resnet50(weights="ResNet50_Weights.DEFAULT")

# Freeze all layers
for param in resnet.parameters():
    param.requires_grad = False

# Replace final layer for your task
num_features = resnet.fc.in_features
resnet.fc = nn.Sequential(
    nn.Linear(num_features, 256),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(256, num_classes),
)

# Only train the new head
optimizer = torch.optim.Adam(resnet.fc.parameters(), lr=1e-3)
```

## Regularisation

```python
# Dropout
dropout = nn.Dropout(p=0.5)        # randomly zero 50% of activations
dropout_2d = nn.Dropout2d(p=0.3)   # for feature maps

# Batch Normalisation
bn = nn.BatchNorm2d(64)            # normalise over spatial dimensions
bn1d = nn.BatchNorm1d(256)         # for fully connected layers

# Layer Normalisation (for Transformers)
ln = nn.LayerNorm(512)

# L1 / L2 weight decay via optimizer
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)
```

## Popular Frameworks

| Framework | Language | Strengths |
|-----------|----------|-----------|
| PyTorch | Python | Research, dynamic graphs, Pythonic |
| TensorFlow | Python/C++ | Production, TFLite, TF Serving |
| Keras | Python | High-level API (now tf.keras) |
| JAX | Python | Functional transforms, TPU support |
| ONNX | - | Model interchange format |

## Common Architectures

### VGG (2014)
Deep CNN using 3×3 convolutions. Simple but large (138M params for VGG-16).

### ResNet (2015)
Introduces residual (skip) connections to enable training of very deep networks (50–152 layers).

```python
class ResidualBlock(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.conv1 = nn.Conv2d(channels, channels, 3, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(channels)
        self.conv2 = nn.Conv2d(channels, channels, 3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(channels)

    def forward(self, x):
        residual = x
        out = torch.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        return torch.relu(out + residual)  # skip connection
```

### BERT (2018)
Bidirectional Transformer encoder pre-trained on masked language modelling and NSP.

### GPT (2018+)
Autoregressive Transformer decoder. GPT-2, GPT-3, GPT-4 scale this architecture massively.
